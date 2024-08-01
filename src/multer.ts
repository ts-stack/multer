import bytes from 'bytes';

import { createLimitGuard } from './limit-guard.js';
import { createHandler } from './handler.js';
import { Strategy, MulterGroup, MulterLimits, NormalizedLimits, MulterOptions, MulterParser } from './types.js';

export class Multer {
  #limits: NormalizedLimits;

  constructor(options: MulterOptions = {}) {
    this.normalizeLimits(options);
  }

  /**
   * Accepts a single file from a form field with the name you pass in the `name` parameter.
   * The single file will be stored in `parsedForm.file` property.
   */
  single<F extends object = any>(name: string): MulterParser<F, never> {
    return this.handle(this.#limits, [{ name, maxCount: 1 }], 'VALUE');
  }

  /**
   * Accepts an array of files from a form field with the name you pass in the `name` parameter.
   * Optionally error out if more than `maxCount` files are uploaded. The array of files will be
   * stored in `parsedForm.files` property.
   * 
   * __Note__: `maxCount` limit has precedence over `limits.files`.
   */
  array<F extends object = any>(name: string, maxCount?: number): MulterParser<F, never> {
    const limits = { ...this.#limits };
    maxCount ??= limits.files;
    if (maxCount >= limits.files) {
      // Allows multer limit guards to work instead of busboy limit guards.
      limits.files = maxCount + 1;
    }
    return this.handle(limits, [{ name, maxCount }], 'ARRAY');
  }

  /**
   * Accepts groups of file arrays with fields of the form you specify with the `group` parameter.
   * An object with arrays of files will be stored in `parsedForm.groups` property.
   * 
   * `groups` should be an array of objects with `name` and optionally a `maxCount`.
   * Example:
   * 
```ts
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```
   * 
   * __Note__: `maxCount` limit has precedence over `limits.files`.
   */
  groups<F extends object = any, G extends string = string>(groups: MulterGroup<G>[]): MulterParser<F, G> {
    const limits = { ...this.#limits };
    limits.files = groups.reduce((prev, curr) => {
      return prev + (curr.maxCount || 0);
    }, 0);
    limits.files = limits.files || this.#limits.files;
    if (limits.files >= this.#limits.files) {
      // Allows multer limit guards to work instead of busboy limit guards.
      limits.files++;
    }
    return this.handle(limits, groups, 'OBJECT');
  }

  /**
   * Accept only text (non-file) fields. If any file upload is made, error with code
   * `LIMIT_UNEXPECTED_FILE` will be issued. This is the same as doing `parse.groups([])`.
   */
  textFields<F extends object = any>(): MulterParser<F, never> {
    return this.handle(this.#limits, [], 'NONE');
  }

  /**
   * Accepts arrays of files from any form fields, with no limit on the number of files.
   * An array of files will be stored in `parsedForm.files`.
   *
   * **WARNING:** Make sure that you always handle the files that a user uploads.
   * Never use this method as a global parser since a malicious user could upload
   * files to a route that you didn't anticipate. Only use this function on routes
   * where you are handling the uploaded files.
   */
  any<F extends object = any>(): MulterParser<F, never> {
    return this.handle(this.#limits, [], 'ARRAY', true);
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

  protected handle(limits: NormalizedLimits, groups: MulterGroup[], fileStrategy: Strategy, withoutGuard?: boolean) {
    if (withoutGuard) {
      return createHandler(() => ({
        groups,
        limits,
        limitGuard: () => {},
        fileStrategy,
      }));
    } else {
      return createHandler(() => ({
        groups,
        limits,
        limitGuard: createLimitGuard(groups),
        fileStrategy,
      }));
    }
  }
}
