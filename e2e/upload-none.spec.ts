import FormData from 'form-data';

import * as util from './_util.js';
import { Multer } from '#lib/multer.js';
import { ParserFn } from '#lib/types.js';

describe('upload.none', () => {
  let parser: ParserFn;

  beforeAll(() => {
    parser = new Multer().none();
  });

  it('should handle text fields', async () => {
    const form = new FormData();
    const parser = new Multer().none();

    form.append('foo', 'bar');
    form.append('test', 'yes');

    const req = await util.submitForm(parser, form);
    expect(req.file).toBe(undefined);
    expect(req.files).toBe(undefined);

    expect(req.formFields.foo).toBe('bar');
    expect(req.formFields.test).toBe('yes');
  });

  it('should reject single file', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('file', util.file('small'));

    const promise = util.submitForm(parser, form);
    await expect(promise).rejects.toMatchObject({ code: 'LIMIT_UNEXPECTED_FILE', field: 'file' });
  });

  it('should reject multiple files', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('file', util.file('tiny'));
    form.append('file', util.file('tiny'));

    const promise = util.submitForm(parser, form);
    await expect(promise).rejects.toMatchObject({ code: 'LIMIT_UNEXPECTED_FILE', field: 'file' });
  });
});
