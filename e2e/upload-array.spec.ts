import FormData from 'form-data';

import * as util from './_util.js';
import { Multer } from '#lib/multer.js';
import { MulterParser } from '#lib/types.js';

describe('upload.array', () => {
  let parser: MulterParser;

  beforeAll(() => {
    parser = new Multer().array('files', 3);
  });

  it('should accept single file', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('files', util.file('small'));

    const parsedForm = await util.submitForm(parser, form);
    const files = parsedForm.files;
    expect(parsedForm.textFields.name).toBe('Multer');
    expect(files.length).toBe(1);

    await util.assertFile(files[0], 'files', 'small');
  });

  it('should accept array of files', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('files', util.file('empty'));
    form.append('files', util.file('small'));
    form.append('files', util.file('tiny'));

    const parsedForm = await util.submitForm(parser, form);
    const files = parsedForm.files;
    expect(parsedForm.textFields.name).toBe('Multer');
    expect(files.length).toBe(3);

    await util.assertFiles([
      [files[0], 'files', 'empty'],
      [files[1], 'files', 'small'],
      [files[2], 'files', 'tiny'],
    ]);
  });

  it('"maxCount" limit must take precedence over "limits.files"', async () => {
    const form = new FormData();
    const parser = new Multer({ limits: { files: 3 } }).array('files', 4);

    form.append('name', 'Multer');
    form.append('files', util.file('empty'));
    form.append('files', util.file('small'));
    form.append('files', util.file('tiny'));
    form.append('files', util.file('tiny'));

    const { files, textFields } = await util.submitForm(parser, form);
    expect(textFields.name).toBe('Multer');
    expect(files.length).toBe(4);

    await util.assertFiles([
      [files[0], 'files', 'empty'],
      [files[1], 'files', 'small'],
      [files[2], 'files', 'tiny'],
      [files[2], 'files', 'tiny'],
    ]);
  });

  it('should reject too many files', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('files', util.file('small'));
    form.append('files', util.file('small'));
    form.append('files', util.file('small'));
    form.append('files', util.file('small'));

    const promise = util.submitForm(parser, form);
    await expect(promise).rejects.toMatchObject({ code: 'LIMIT_FILE_COUNT', field: 'files' });
  });

  it('should reject unexpected field', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('unexpected', util.file('small'));

    const promise = util.submitForm(parser, form);
    await expect(promise).rejects.toMatchObject({ code: 'LIMIT_UNEXPECTED_FILE', field: 'unexpected' });
  });
});
