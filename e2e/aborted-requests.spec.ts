import assert from 'node:assert';
import { PassThrough } from 'node:stream';
import { promisify } from 'node:util';

import FormData from 'form-data';

import * as util from './_util.js';
import { Multer } from '#lib/multer.js';
import { AnyFn } from '#lib/types.js';

function getLength(form: FormData) {
  return promisify(form.getLength).call(form);
}

function createAbortStream(maxBytes: number, aborter: AnyFn) {
  let bytesPassed = 0;

  return new PassThrough({
    transform(chunk, _, cb) {
      if (bytesPassed + chunk.length < maxBytes) {
        bytesPassed += chunk.length;
        this.push(chunk);
        return cb();
      }

      const bytesLeft = maxBytes - bytesPassed;

      if (bytesLeft) {
        bytesPassed += bytesLeft;
        this.push(chunk.slice(0, bytesLeft));
      }

      process.nextTick(() => aborter(this));
    },
  });
}

describe('Aborted requests', () => {
  it('should handle clients aborting the request', async () => {
    const form = new FormData();
    const parser = new Multer().single('file');

    form.append('file', util.file('small'));

    const length = await getLength(form);
    const req = createAbortStream(length - 100, (stream) => stream.emit('aborted'));

    (req as any).headers = {
      'content-type': `multipart/form-data; boundary=${form.getBoundary()}`,
      'content-length': length,
    };

    const result = promisify(parser)(form.pipe(req) as any, null);

    return assert.rejects(result, (err: any) => err.code === 'CLIENT_ABORTED');
  });

  it('should handle clients erroring the request', async () => {
    const form = new FormData();
    const parser = new Multer().single('file');

    form.append('file', util.file('small'));

    const length = await getLength(form);
    const req = createAbortStream(length - 100, (stream) => stream.emit('error', new Error('TEST_ERROR')));

    (req as any).headers = {
      'content-type': `multipart/form-data; boundary=${form.getBoundary()}`,
      'content-length': length,
    };

    const result = promisify(parser)(form.pipe(req) as any, null);

    return assert.rejects(result, (err: any) => err.message === 'TEST_ERROR');
  });
});
