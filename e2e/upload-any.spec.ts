import FormData from 'form-data';

import * as util from './_util.js';
import { Multer } from '#lib/multer.js';
import { MulterParser } from '#lib/types.js';

describe('upload.any', () => {
  let parser: MulterParser;

  beforeAll(() => {
    parser = new Multer().any();
  });

  it('should accept single file', async () => {
    const form = new FormData();

    form.append('test', util.file('tiny'));

    const parsedForm = await util.submitForm(parser, form);
    const files = parsedForm.files;
    expect(files.length).toBe(1);

    await util.assertFile(files[0], 'test', 'tiny');
  });

  it('should accept some files', async () => {
    const form = new FormData();

    form.append('foo', util.file('empty'));
    form.append('foo', util.file('small'));
    form.append('test', util.file('empty'));
    form.append('anyname', util.file('tiny'));

    const req = await util.submitForm(parser, form);
    const files = req.files;
    expect(files.length).toBe(4);

    await util.assertFiles([
      [files[0], 'foo', 'empty'],
      [files[1], 'foo', 'small'],
      [files[2], 'test', 'empty'],
      [files[3], 'anyname', 'tiny'],
    ]);
  });

  it('should accept any files', async () => {
    const form = new FormData();

    form.append('set-0', util.file('empty'));
    form.append('set-1', util.file('tiny'));
    form.append('set-0', util.file('empty'));
    form.append('set-1', util.file('tiny'));
    form.append('set-2', util.file('tiny'));
    form.append('set-1', util.file('tiny'));
    form.append('set-2', util.file('empty'));

    const parsedForm = await util.submitForm(parser, form);
    const files = parsedForm.files;
    expect(files.length).toBe(7);

    await util.assertFiles([
      [files[0], 'set-0', 'empty'],
      [files[1], 'set-1', 'tiny'],
      [files[2], 'set-0', 'empty'],
      [files[3], 'set-1', 'tiny'],
      [files[4], 'set-2', 'tiny'],
      [files[5], 'set-1', 'tiny'],
      [files[6], 'set-2', 'empty'],
    ]);
  });
});
