import bytes from 'bytes';

import { createFileFilter } from './file-filter.js';
import { createMiddleware } from './middleware.js';
import { MulterStrategy, MulterField, MulterLimits, MulterOptions } from './types.js';

function parseLimit(limits: MulterLimits, key: keyof MulterLimits, defaultValue: string | number) {
  const input = limits![key] == null ? defaultValue : limits![key];
  const value = bytes.parse(input);
  if (!Number.isFinite(value)) throw new Error(`Invalid limit "${key}" given: ${limits![key]}`);
  if (!Number.isInteger(value)) throw new Error(`Invalid limit "${key}" given: ${value}`);
  return value;
}

function _middleware(limits: MulterLimits, fields: MulterField[], fileStrategy: MulterStrategy) {
  return createMiddleware(() => ({
    fields,
    limits,
    fileFilter: createFileFilter(fields),
    fileStrategy,
  }));
}

export class Multer {
  #limits: MulterLimits;

  constructor(options: MulterOptions = {}) {
  if (options === null) throw new TypeError('Expected object for argument "options", got null');
  if (typeof options != 'object') throw new TypeError(`Expected object for argument "options", got ${typeof options}`);

    this.#limits = {
      fieldNameSize: parseLimit(options.limits || {}, 'fieldNameSize', '100B'),
      fieldSize: parseLimit(options.limits || {}, 'fieldSize', '8KB'),
      fields: parseLimit(options.limits || {}, 'fields', 1000),
      fileSize: parseLimit(options.limits || {}, 'fileSize', '8MB'),
      files: parseLimit(options.limits || {}, 'files', 10),
      headerPairs: parseLimit(options.limits || {}, 'headerPairs', 2000),
    } as MulterLimits;
  }

  /**
   * Accept a single file with the `name`. The single file will be stored in `req.file`.
   */
  single(name: string) {
    return _middleware(this.#limits, [{ name: name, maxCount: 1 }], 'VALUE');
  }

  /**
   * Accept an array of files, all with the `name`. Optionally error out if
   * more than `maxCount` files are uploaded. The array of files will be stored in
   * `req.files`.
   */
  array(name: string, maxCount?: number) {
    return _middleware(this.#limits, [{ name: name, maxCount: maxCount }], 'ARRAY');
  }

  /**
   * Accept a mix of files, specified by `fields`. An object with arrays of files
   * will be stored in `req.files`.
   * 
   * `fields` should be an array of objects with `name` and optionally a `maxCount`.
   * Example:
   * 
```ts
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```
   */
  fields(fields: MulterField[]) {
    return _middleware(this.#limits, fields, 'OBJECT');
  }

  /**
   * Accept only text fields. If any file upload is made, error with code
   * `LIMIT_UNEXPECTED_FILE` will be issued. This is the same as doing `upload.fields([])`.
   */
  none() {
    return _middleware(this.#limits, [], 'NONE');
  }

  /**
   * Accepts all files that comes over the wire. An array of files will be stored in
   * `req.files`.
   *
   * **WARNING:** Make sure that you always handle the files that a user uploads.
   * Never add multer as a global middleware since a malicious user could upload
   * files to a route that you didn't anticipate. Only use this function on routes
   * where you are handling the uploaded files.
   */
  any() {
    return createMiddleware(() => ({
      fields: [],
      limits: this.#limits,
      fileFilter: () => {},
      fileStrategy: 'ARRAY',
    }));
  }
}
