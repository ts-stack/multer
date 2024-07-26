import assert from 'node:assert';
import FormData from 'form-data';

import * as util from './_util.js';
import { Multer } from '#lib/multer.js';

describe('limits', () => {
  it('should report limit errors', async () => {
    const form = new FormData();
    const parser = new Multer({ limits: { fileSize: 100 } }).single('file');

    form.append('file', util.file('large'));

    await assert.rejects(
      util.submitForm(parser, form),
      (err: any) => err.code === 'LIMIT_FILE_SIZE' && err.field === 'file',
    );
  });
});
