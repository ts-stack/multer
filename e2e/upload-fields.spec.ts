import assert from 'node:assert';
import FormData from 'form-data';

import * as util from './_util.js';
import multer from '#lib/index.js';
import { MulterFilesInObject, Middleware } from '#lib/types.js';

describe('upload.fields', () => {
  let parser: Middleware;

  beforeAll(() => {
    parser = multer().fields([
      { name: 'CA$|-|', maxCount: 1 },
      { name: 'set-1', maxCount: 3 },
      { name: 'set-2', maxCount: 3 },
    ]);
  });

  it('should accept single file', async () => {
    const form = new FormData();

    form.append('set-2', util.file('tiny'));

    const req = await util.submitForm(parser, form);
    const filesInObject = req.files as MulterFilesInObject;
    assert.strictEqual(filesInObject['CA$|-|'].length, 0);
    assert.strictEqual(filesInObject['set-1'].length, 0);
    assert.strictEqual(filesInObject['set-2'].length, 1);

    await util.assertFile(filesInObject['set-2'][0], 'set-2', 'tiny');
  });

  it('should accept some files', async () => {
    const form = new FormData();

    form.append('CA$|-|', util.file('empty'));
    form.append('set-1', util.file('small'));
    form.append('set-1', util.file('empty'));
    form.append('set-2', util.file('tiny'));

    const req = await util.submitForm(parser, form);
    const filesInObject = req.files as MulterFilesInObject;
    assert.strictEqual(filesInObject['CA$|-|'].length, 1);
    assert.strictEqual(filesInObject['set-1'].length, 2);
    assert.strictEqual(filesInObject['set-2'].length, 1);

    await util.assertFiles([
      [filesInObject['CA$|-|'][0], 'CA$|-|', 'empty'],
      [filesInObject['set-1'][0], 'set-1', 'small'],
      [filesInObject['set-1'][1], 'set-1', 'empty'],
      [filesInObject['set-2'][0], 'set-2', 'tiny'],
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

    const req = await util.submitForm(parser, form);
    const filesInObject = req.files as MulterFilesInObject;
    assert.strictEqual(filesInObject['CA$|-|'].length, 1);
    assert.strictEqual(filesInObject['set-1'].length, 3);
    assert.strictEqual(filesInObject['set-2'].length, 3);

    await util.assertFiles([
      [filesInObject['CA$|-|'][0], 'CA$|-|', 'empty'],
      [filesInObject['set-1'][0], 'set-1', 'tiny'],
      [filesInObject['set-1'][1], 'set-1', 'empty'],
      [filesInObject['set-1'][2], 'set-1', 'tiny'],
      [filesInObject['set-2'][0], 'set-2', 'tiny'],
      [filesInObject['set-2'][1], 'set-2', 'tiny'],
      [filesInObject['set-2'][2], 'set-2', 'empty'],
    ]);
  });

  it('should reject too many files', async () => {
    const form = new FormData();

    form.append('CA$|-|', util.file('small'));
    form.append('CA$|-|', util.file('small'));

    await assert.rejects(
      util.submitForm(parser, form),
      (err: any) => err.code === 'LIMIT_FILE_COUNT' && err.field === 'CA$|-|',
    );
  });

  it('should reject unexpected field', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('unexpected', util.file('small'));

    await assert.rejects(
      util.submitForm(parser, form),
      (err: any) => err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'unexpected',
    );
  });
});
