import { PassThrough, pipeline } from 'node:stream';
import FormData from 'form-data';

import * as util from './_util.js';
import { Multer } from '#lib/multer.js';
import { MulterFile } from '#lib/types.js';

describe('Misc', () => {
  it('should handle unicode filenames', async () => {
    const form = new FormData();
    const parser = new Multer().single('file');
    const filename = '\ud83d\udca9.dat';

    form.append('file', util.file('small'), { filename });

    const req = await util.submitForm(parser, form);
    expect(req.file!.originalName).toBe(filename);

    // Ignore content
    req.file!.stream.resume();
  });

  it('should handle absent filenames', async () => {
    const form = new FormData();
    const parser = new Multer().single('file');
    const stream = util.file('small');

    // Don't let FormData figure out a filename
    const hidden = pipeline(stream, new PassThrough(), () => {});

    form.append('file', hidden, { knownLength: util.knownFileLength('small') });

    const req = await util.submitForm(parser, form);
    expect(req.file!.originalName).toBe(undefined);

    // Ignore content
    req.file!.stream.resume();
  });

  it('should present files in same order as they came', async () => {
    const parser = new Multer().array('themFiles', 2);
    const form = new FormData();

    form.append('themFiles', util.file('small'));
    form.append('themFiles', util.file('tiny'));

    const req = await util.submitForm(parser, form);
    const files = req.files as MulterFile[];
    expect(files.length).toBe(2);

    util.assertFiles([
      [files[0], 'themFiles', 'small'],
      [files[1], 'themFiles', 'tiny'],
    ]);
  });

  it('should accept multiple requests', async () => {
    const parser = new Multer().array('them-files');

    async function submitData(fileCount: number) {
      const form = new FormData();

      for (let i = 0; i < fileCount; i++) {
        form.append('them-files', util.file('small'));
      }

      const req = await util.submitForm(parser, form);
      const files = req.files as MulterFile[];
      expect(files.length).toBe(fileCount);

      await util.assertFiles(files.map((file: MulterFile) => [file, 'them-files', 'small']));
    }

    await Promise.all([9, 1, 5, 7, 2, 8, 3, 4].map(submitData));
  });
});
