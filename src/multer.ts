import bytes from 'bytes';

import { createLimitGuard } from './limit-guard.js';
import { createMiddleware } from './middleware.js';
import { MulterStrategy, MulterField, MulterLimits, NormalizedLimits, MulterOptions } from './types.js';

export class Multer {
  #limits: NormalizedLimits;

  constructor(options: MulterOptions = {}) {
    this.normalizeLimits(options);
  }

  /**
   * Accept a single file with the `name`. The single file will be stored in `req.file`.
   */
  single(name: string) {
    return this.middleware(this.#limits, [{ name, maxCount: 1 }], 'VALUE');
  }

  /**
   * Accept an array of files, all with the `name`. Optionally error out if
   * more than `maxCount` files are uploaded. The array of files will be stored in
   * `req.files`.
   */
  array(name: string, maxCount?: number) {
    return this.middleware(this.#limits, [{ name, maxCount }], 'ARRAY');
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
    return this.middleware(this.#limits, fields, 'OBJECT');
  }

  /**
   * Accept only text fields. If any file upload is made, error with code
   * `LIMIT_UNEXPECTED_FILE` will be issued. This is the same as doing `upload.fields([])`.
   */
  none() {
    return this.middleware(this.#limits, [], 'NONE');
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
    return this.middleware(this.#limits, [], 'ARRAY', true);
  }

  protected normalizeLimits(options: MulterOptions) {
    const limits = options.limits || {};
    this.#limits = {
      fieldNameSize: this.parseLimit(limits, 'fieldNameSize', '100B'),
      fieldSize: this.parseLimit(limits, 'fieldSize', '8KB'),
      fields: this.parseLimit(limits, 'fields', 1000),
      fileSize: this.parseLimit(limits, 'fileSize', '8MB'),
      files: this.parseLimit(limits, 'files', 10),
      headerPairs: this.parseLimit(limits, 'headerPairs', 2000),
    } as NormalizedLimits;
  }

  protected parseLimit(limits: MulterLimits, key: keyof MulterLimits, defaultValue: string | number) {
    const input = limits[key] ?? defaultValue;
    const value = bytes.parse(input);
    if (!Number.isFinite(value)) throw new Error(`Invalid limit "${key}" given: ${limits[key]}`);
    if (!Number.isInteger(value)) throw new Error(`Invalid limit "${key}" given: ${value}`);
    return value;
  }

  protected middleware(
    limits: NormalizedLimits,
    fields: MulterField[],
    fileStrategy: MulterStrategy,
    withoutGuard?: boolean,
  ) {
    if (withoutGuard) {
      return createMiddleware(() => ({
        fields,
        limits,
        limitGuard: () => {},
        fileStrategy,
      }));
    } else {
      return createMiddleware(() => ({
        fields,
        limits,
        limitGuard: createLimitGuard(fields),
        fileStrategy,
      }));
    }
  }
}
