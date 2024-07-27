import assert from 'node:assert';
import fs from 'node:fs';
import { PassThrough } from 'node:stream';
import { promisify } from 'node:util';
import FormData from 'form-data';

import hasha from 'hasha';
import _onFinished from 'on-finished';
import { Middleware, MulterFile, Req } from '#lib/types.js';

const onFinished = promisify(_onFinished);

type FileSize = 'empty' | 'tiny' | 'small' | 'medium' | 'large';

const files = new Map<FileSize, Partial<MulterFile>>([
  [
    'empty',
    {
      clientReportedMimeType: 'application/octet-stream',
      detectedFileExtension: '',
      detectedMimeType: null,
      extension: '.dat',
      hash: 'd41d8cd98f00b204e9800998ecf8427e',
      size: 0,
    },
  ],
  [
    'large',
    {
      clientReportedMimeType: 'application/octet-stream',
      detectedFileExtension: '',
      detectedMimeType: null,
      extension: '',
      hash: 'd5554977e0b856fa5ad94fff283616fb',
      size: 2413677,
    },
  ],
  [
    'medium',
    {
      clientReportedMimeType: 'application/octet-stream',
      detectedFileExtension: '.gif',
      detectedMimeType: 'image/gif',
      extension: '.fake',
      hash: 'a88025890e6a2cd15edb83e0aecdddd1',
      size: 21057,
    },
  ],
  [
    'small',
    {
      clientReportedMimeType: 'application/octet-stream',
      detectedFileExtension: '',
      detectedMimeType: null,
      extension: '.dat',
      hash: '3817334ffb4cf3fcaa16c4258d888131',
      size: 1778,
    },
  ],
  [
    'tiny',
    {
      clientReportedMimeType: 'audio/midi',
      detectedFileExtension: '.mid',
      detectedMimeType: 'audio/midi',
      extension: '.mid',
      hash: 'c187e1be438cb952bb8a0e8142f4a6d1',
      size: 248,
    },
  ],
]);

export function file(name: FileSize) {
  return fs.createReadStream(new URL(`../e2e/files/${name}${files.get(name)!.extension}`, import.meta.url));
}

export function knownFileLength(name: FileSize) {
  return files.get(name)!.size;
}

export async function assertFile(file: MulterFile, fieldName: string, fileName: FileSize) {
  if (!files.has(fileName)) {
    throw new Error(`No file named "${fileName}"`);
  }

  const expected = files.get(fileName)!;

  assert.strictEqual(file.fieldName, fieldName);
  assert.strictEqual(file.originalName, fileName + expected.extension);
  assert.strictEqual(file.size, expected.size);

  assert.strictEqual(file.clientReportedMimeType, expected.clientReportedMimeType);
  assert.strictEqual(file.clientReportedFileExtension, expected.extension);

  assert.strictEqual(file.detectedMimeType, expected.detectedMimeType);
  assert.strictEqual(file.detectedFileExtension, expected.detectedFileExtension);

  const hash = await hasha.fromStream(file.stream, { algorithm: 'md5' });

  assert.strictEqual(hash, expected.hash);
}

export async function assertFiles(files: [MulterFile, string, FileSize][]) {
  await Promise.all(files.map((args) => assertFile(args[0], args[1], args[2])));
}

function getLength(form: FormData) {
  return promisify(form.getLength).call(form);
}

export async function submitForm(multer: Middleware, form: FormData) {
  const length = await getLength(form);
  const req = new PassThrough() as unknown as Req;

  req.complete = false;
  form.once('end', () => {
    req.complete = true;
  });

  form.pipe(req as any);
  req.headers = {
    'content-type': `multipart/form-data; boundary=${form.getBoundary()}`,
    'content-length': String(length),
  };

  await promisify(multer)(req, null);
  await onFinished(req);

  return req;
}
