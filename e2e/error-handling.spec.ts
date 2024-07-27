import { PassThrough } from 'node:stream';
import FormData from 'form-data';

import * as util from './_util.js';
import { Multer } from '#lib/multer.js';
import { AnyFn, MulterField, MulterLimits, ParserFn, Req } from '#lib/types.js';
import { ErrorMessageCode } from '#lib/error.js';

function withLimits(limits: MulterLimits, fields: MulterField[]) {
  return new Multer({ limits }).fields(fields);
}

function hasCode(parser: ParserFn, form: FormData, code: ErrorMessageCode) {
  return expect(util.submitForm(parser, form)).rejects.toMatchObject({ code });
}

function hasCodeAndField(parser: ParserFn, form: FormData, code: ErrorMessageCode, field: string) {
  return expect(util.submitForm(parser, form)).rejects.toMatchObject({ code, field });
}

function hasMessage(parser: ParserFn, req: Req, message: string) {
  return expect(parser(req, req.headers)).rejects.toMatchObject({ message });
}

describe('Error Handling', () => {
  it('should throw on invalid limits', () => {
    expect(() => new Multer({ limits: { files: 3.14 } })).toThrow('Invalid limit "files" given: 3.14');
    expect(() => new Multer({ limits: { fileSize: 'foobar' as any } })).toThrow(
      'Invalid limit "fileSize" given: foobar',
    );
  });

  it('should respect file size limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fileSize: 1500 }, [
      { name: 'tiny', maxCount: 1 },
      { name: 'small', maxCount: 1 },
    ]);

    form.append('tiny', util.file('tiny'));
    form.append('small', util.file('small'));

    await hasCodeAndField(parser, form, 'LIMIT_FILE_SIZE', 'small');
  });

  it('should respect file count limit', async () => {
    const form = new FormData();
    const parser = withLimits({ files: 1 }, [
      { name: 'small', maxCount: 1 },
      { name: 'small', maxCount: 1 },
    ]);

    form.append('small', util.file('small'));
    form.append('small', util.file('small'));

    await hasCode(parser, form, 'LIMIT_FILE_COUNT');
  });

  it('should respect file key limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fieldNameSize: 4 }, [{ name: 'small', maxCount: 1 }]);

    form.append('small', util.file('small'));

    await hasCode(parser, form, 'LIMIT_FIELD_KEY');
  });

  it('should respect field key limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fieldNameSize: 4 }, []);

    form.append('ok', 'SMILE');
    form.append('blowup', 'BOOM!');

    await hasCode(parser, form, 'LIMIT_FIELD_KEY');
  });

  it('should respect field value limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fieldSize: 16 }, []);

    form.append('field0', 'This is okay');
    form.append('field1', 'This will make the parser explode');

    await hasCodeAndField(parser, form, 'LIMIT_FIELD_VALUE', 'field1');
  });

  it('should respect field count limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fields: 1 }, []);

    form.append('field0', 'BOOM!');
    form.append('field1', 'BOOM!');

    await hasCode(parser, form, 'LIMIT_FIELD_COUNT');
  });

  it('should respect fields given', async () => {
    const form = new FormData();
    const parser = withLimits(undefined as any, [{ name: 'wrongname', maxCount: 1 }]);

    form.append('small', util.file('small'));

    await hasCodeAndField(parser, form, 'LIMIT_UNEXPECTED_FILE', 'small');
  });

  it('should report errors from busboy constructor', async () => {
    const req = new PassThrough() as unknown as Req & { end: AnyFn };
    const parser = new Multer().single('tiny');
    const body = 'test';

    req.headers = {
      'content-type': 'multipart/form-data',
      'content-length': String(body.length),
    };

    req.end(body);

    await hasMessage(parser, req, 'Multipart: Boundary not found');
  });

  it('should report errors from busboy parsing', async () => {
    const req = new PassThrough() as unknown as Req & { end: AnyFn };
    const parser = new Multer().single('tiny');
    const boundary = 'AaB03x';
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="tiny"; filename="test.txt"',
      'Content-Type: text/plain',
      '',
      'test without end boundary',
    ].join('\r\n');

    req.headers = {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': String(body.length),
    };

    req.end(body);

    await hasMessage(parser, req, 'Unexpected end of multipart data');
  });

  it('should gracefully handle more than one error at a time', async () => {
    const form = new FormData();
    const parser = withLimits({ fileSize: 1, files: 1 }, [{ name: 'small', maxCount: 1 }]);

    form.append('small', util.file('small'));
    form.append('small', util.file('small'));

    await hasCode(parser, form, 'LIMIT_FILE_SIZE');
  });
});
