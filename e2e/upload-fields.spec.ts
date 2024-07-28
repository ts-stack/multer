import FormData from 'form-data';

import * as util from './_util.js';
import { Multer } from '#lib/multer.js';
import { ParserFn } from '#lib/types.js';

describe('upload.fields', () => {
  let parser: ParserFn;

  beforeAll(() => {
    parser = new Multer({ limits: { fileSize: '10MB' } }).groups([
      { name: 'CA$|-|', maxCount: 1 },
      { name: 'set-1', maxCount: 3 },
      { name: 'set-2', maxCount: 3 },
    ]);
  });

  it('should accept single file', async () => {
    const form = new FormData();

    form.append('set-2', util.file('tiny'));

    const parsedForm = await util.submitForm(parser, form);
    const fileGroups = parsedForm.groups;
    expect(fileGroups['CA$|-|'].length).toBe(0);
    expect(fileGroups['set-1'].length).toBe(0);
    expect(fileGroups['set-2'].length).toBe(1);

    await util.assertFile(fileGroups['set-2'][0], 'set-2', 'tiny');
  });

  it('should accept some files', async () => {
    const form = new FormData();

    form.append('CA$|-|', util.file('empty'));
    form.append('set-1', util.file('small'));
    form.append('set-1', util.file('empty'));
    form.append('set-2', util.file('tiny'));

    const parsedForm = await util.submitForm(parser, form);
    const fileGroups = parsedForm.groups;
    expect(fileGroups['CA$|-|'].length).toBe(1);
    expect(fileGroups['set-1'].length).toBe(2);
    expect(fileGroups['set-2'].length).toBe(1);

    await util.assertFiles([
      [fileGroups['CA$|-|'][0], 'CA$|-|', 'empty'],
      [fileGroups['set-1'][0], 'set-1', 'small'],
      [fileGroups['set-1'][1], 'set-1', 'empty'],
      [fileGroups['set-2'][0], 'set-2', 'tiny'],
    ]);
  });

  it('should accept all files', async () => {
    const form = new FormData();

    form.append('CA$|-|', util.file('empty'));
    form.append('set-1', util.file('tiny'));
    form.append('set-1', util.file('empty'));
    form.append('set-1', util.file('tiny'));
    form.append('set-2', util.file('tiny'));
    form.append('set-2', util.file('tiny'));
    form.append('set-2', util.file('empty'));

    const parsedForm = await util.submitForm(parser, form);
    const fileGroups = parsedForm.groups;
    expect(fileGroups['CA$|-|'].length).toBe(1);
    expect(fileGroups['set-1'].length).toBe(3);
    expect(fileGroups['set-2'].length).toBe(3);

    await util.assertFiles([
      [fileGroups['CA$|-|'][0], 'CA$|-|', 'empty'],
      [fileGroups['set-1'][0], 'set-1', 'tiny'],
      [fileGroups['set-1'][1], 'set-1', 'empty'],
      [fileGroups['set-1'][2], 'set-1', 'tiny'],
      [fileGroups['set-2'][0], 'set-2', 'tiny'],
      [fileGroups['set-2'][1], 'set-2', 'tiny'],
      [fileGroups['set-2'][2], 'set-2', 'empty'],
    ]);
  });

  it('should reject too many files', async () => {
    const form = new FormData();

    form.append('CA$|-|', util.file('small'));
    form.append('CA$|-|', util.file('small'));

    await expect(util.submitForm(parser, form)).rejects.toMatchObject({ code: 'LIMIT_FILE_COUNT', field: 'CA$|-|' });
  });

  it('should reject unexpected field', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('unexpected', util.file('small'));

    await expect(util.submitForm(parser, form)).rejects.toMatchObject({
      code: 'LIMIT_UNEXPECTED_FILE',
      field: 'unexpected',
    });
  });
});
