import FormData from 'form-data';

import * as util from './_util.js';
import { Multer } from '#lib/multer.js';
import { Middleware } from '#lib/types.js';

describe('upload.single', () => {
  let parser: Middleware;

  beforeAll(() => {
    parser = new Multer().single('file');
  });

  it('should accept single file', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('file', util.file('small'));

    const req = await util.submitForm(parser, form);
    expect(req.body.name).toBe('Multer');

    await util.assertFile(req.file!, 'file', 'small');
  });

  it('should reject multiple files', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('file', util.file('tiny'));
    form.append('file', util.file('tiny'));

    const promise = util.submitForm(parser, form);
    await expect(promise).rejects.toMatchObject({ code: 'LIMIT_FILE_COUNT', field: 'file' });
  });

  it('should reject unexpected field', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('unexpected', util.file('tiny'));

    const promise = util.submitForm(parser, form);
    await expect(promise).rejects.toMatchObject({ code: 'LIMIT_UNEXPECTED_FILE', field: 'unexpected' });
  });
});
