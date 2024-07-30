import { PassThrough, Transform } from 'node:stream';
import { fileTypeFromStream } from 'file-type';

import { AnyFn } from './types.js';

export class FileType extends Transform {
  #stream: PassThrough | null;
  #result: Promise<{ ext: string; mime: string } | null>;
  #transformCalled: boolean;

  constructor() {
    super();
    this.#stream = new PassThrough();

    this.#result = fileTypeFromStream(this.#stream).then(
      (value) => {
        this.#stream = null;
        return value || null;
      },
      (err) => {
        this.#stream = null;
        return null;
      },
    );
  }

  fileTypePromise() {
    return this.#result;
  }

  override _transform(chunk: any, _: any, cb: AnyFn) {
    this.#transformCalled = true;
    if (this.#stream != null) {
      this.#stream.write(chunk);
    }

    cb(null, chunk);
  }

  override _flush(cb: AnyFn) {
    if (this.#transformCalled) {
      this.#result.finally(() => this.finish(cb));
    } else {
      this.finish(cb);
    }
  }

  protected finish(cb: AnyFn) {
    cb(null);
    this.#stream?.end();
  }
}
