import { extname } from 'node:path';
import { pipeline as _pipeline, type Readable } from 'node:stream';
import { promisify } from 'node:util';
import { createWriteStream } from 'node:fs';
import { Busboy } from '@fastify/busboy';
import { temporaryFile } from 'tempy';
import { IncomingHttpHeaders } from 'node:http';

import { FileType } from './stream-file-type.js';
import { MulterError } from './error.js';
import { MulterFile, LimitGuard, NormalizedLimits } from './types.js';
import { onFinished as preOnFinished } from './on-finished.js';

const onFinished = promisify(preOnFinished);
const pipeline = promisify(_pipeline);

function drainStream(stream: Readable) {
  stream.on('readable', stream.read.bind(stream));
}

function collectFields(busboy: Busboy, limits: NormalizedLimits) {
  return new Promise<{ key: string; value: string }[]>((resolve, reject) => {
    const result: { key: string; value: string }[] = [];

    busboy.on('field', (fieldname, value, fieldnameTruncated, valueTruncated) => {
      // Currently not implemented (https://github.com/mscdex/busboy/issues/6)
      if (fieldnameTruncated) return reject(new MulterError('LIMIT_FIELD_KEY'));

      if (valueTruncated) return reject(new MulterError('LIMIT_FIELD_VALUE', fieldname));

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits?.fieldNameSize !== undefined && fieldname.length > limits.fieldNameSize) {
        return reject(new MulterError('LIMIT_FIELD_KEY'));
      }

      result.push({ key: fieldname, value });
    });

    busboy.on('finish', () => resolve(result));
  });
}

function collectFiles(busboy: Busboy, limits: NormalizedLimits, limitGuard: LimitGuard) {
  return new Promise<MulterFile[]>((resolve, reject) => {
    const result: Promise<MulterFile>[] = [];

    busboy.on('file', async (fieldName, fileStream, filename, encoding, mimetype) => {
      // Catch all errors on file stream
      fileStream.on('error', reject);

      // Catch limit exceeded on file stream
      fileStream.on('limit', () => {
        reject(new MulterError('LIMIT_FILE_SIZE', fieldName));
      });

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits?.fieldNameSize !== undefined && fieldName.length > limits.fieldNameSize) {
        return reject(new MulterError('LIMIT_FIELD_KEY'));
      }

      const file = {
        fieldName,
        originalName: filename,
        clientReportedMimeType: mimetype,
        clientReportedFileExtension: extname(filename || ''),
      } as MulterFile;

      try {
        limitGuard(file);
      } catch (err: any) {
        return reject(err);
      }

      const path = temporaryFile();
      const target = createWriteStream(path);
      const detector = new FileType();
      const fileClosed = new Promise((resolve) => target.on('close', resolve));

      const promise = pipeline(fileStream, detector, target)
        .then(async () => {
          await fileClosed;
          file.path = target.path as string;
          file.size = target.bytesWritten;

          const fileType = await detector.fileTypePromise();
          file.detectedMimeType = fileType?.mime ?? null;
          file.detectedFileExtension = fileType ? `.${fileType.ext}` : '';

          return file;
        })
        .catch(reject);

      result.push(promise as Promise<MulterFile>);
    });

    busboy.on('finish', () => resolve(Promise.all(result)));
  });
}

export async function readBody(
  req: Readable,
  headers: IncomingHttpHeaders,
  limits: NormalizedLimits,
  limitGuard: LimitGuard,
) {
  const busboy = new Busboy({ headers: headers as any, limits });

  const promiseFields = collectFields(busboy, limits);
  const promiseFiles = collectFiles(busboy, limits, limitGuard);
  const promiseGuard = new Promise((resolve, reject) => {
    req.on('error', (err) => reject(err));
    busboy.on('error', (err) => reject(err));

    req.on('aborted', () => reject(new MulterError('CLIENT_ABORTED')));
    busboy.on('filesLimit', () => reject(new MulterError('LIMIT_FILE_COUNT')));
    busboy.on('fieldsLimit', () => reject(new MulterError('LIMIT_FIELD_COUNT')));

    busboy.on('finish', resolve);
  });

  req.pipe(busboy);

  try {
    const [fields, files] = await Promise.all([promiseFields, promiseFiles, promiseGuard]);
    return { fields, files };
  } catch (err) {
    req.unpipe(busboy);
    drainStream(req);
    busboy.removeAllListeners();

    // Wait for request to close, finish, or error
    await onFinished(req).catch(() => {});

    throw err;
  }
}
