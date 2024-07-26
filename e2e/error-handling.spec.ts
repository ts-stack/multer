import assert from 'node:assert';
import { PassThrough } from 'node:stream';
import { promisify } from 'node:util';

import FormData from 'form-data';

import * as util from './_util.js';
import { getMulter } from '#lib/index.js';
import { AnyFn, MulterField, MulterLimits, Req } from '#lib/types.js';
import { ErrorMessageCode } from '#lib/error.js';

function withLimits(limits: MulterLimits, fields: MulterField[]) {
  return getMulter({ limits: limits }).fields(fields);
}

function hasCode(code: ErrorMessageCode) {
  return (err: any) => err.code === code;
}

function hasCodeAndField(code: ErrorMessageCode, field: MulterField) {
  return (err: any) => err.code === code && err.field === field;
}

function hasMessage(message: string) {
  return (err: any) => err.message === message;
}

describe('Error Handling', () => {
  it('should throw on null', () => {
    assert.throws(() => getMulter(null as any));
  });

  it('should throw on boolean', () => {
    assert.throws(() => getMulter(true as any));
    assert.throws(() => getMulter(false as any));
  });

  it('should throw on invalid limits', () => {
    assert.throws(() => getMulter({ limits: { files: 3.14 } }), /Invalid limit "files" given: 3.14/);
    assert.throws(() => getMulter({ limits: { fileSize: 'foobar' as any } }), /Invalid limit "fileSize" given: foobar/);
  });

  it('should respect file size limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fileSize: 1500 }, [
      { name: 'tiny', maxCount: 1 },
      { name: 'small', maxCount: 1 },
    ]);

    form.append('tiny', util.file('tiny'));
    form.append('small', util.file('small'));

    await assert.rejects(util.submitForm(parser, form), hasCodeAndField('LIMIT_FILE_SIZE', 'small' as any));
  });

  it('should respect file count limit', async () => {
    const form = new FormData();
    const parser = withLimits({ files: 1 }, [
      { name: 'small', maxCount: 1 },
      { name: 'small', maxCount: 1 },
    ]);

    form.append('small', util.file('small'));
    form.append('small', util.file('small'));

    await assert.rejects(util.submitForm(parser, form), hasCode('LIMIT_FILE_COUNT'));
  });

  it('should respect file key limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fieldNameSize: 4 }, [{ name: 'small', maxCount: 1 }]);

    form.append('small', util.file('small'));

    await assert.rejects(util.submitForm(parser, form), hasCode('LIMIT_FIELD_KEY'));
  });

  it('should respect field key limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fieldNameSize: 4 }, []);

    form.append('ok', 'SMILE');
    form.append('blowup', 'BOOM!');

    await assert.rejects(util.submitForm(parser, form), hasCode('LIMIT_FIELD_KEY'));
  });

  it('should respect field value limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fieldSize: 16 }, []);

    form.append('field0', 'This is okay');
    form.append('field1', 'This will make the parser explode');

    await assert.rejects(util.submitForm(parser, form), hasCodeAndField('LIMIT_FIELD_VALUE', 'field1' as any));
  });

  it('should respect field count limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fields: 1 }, []);

    form.append('field0', 'BOOM!');
    form.append('field1', 'BOOM!');

    await assert.rejects(util.submitForm(parser, form), hasCode('LIMIT_FIELD_COUNT'));
  });

  it('should respect fields given', async () => {
    const form = new FormData();
    const parser = withLimits(undefined as any, [{ name: 'wrongname', maxCount: 1 }]);

    form.append('small', util.file('small'));

    await assert.rejects(util.submitForm(parser, form), hasCodeAndField('LIMIT_UNEXPECTED_FILE', 'small' as any));
  });

  it('should report errors from busboy constructor', async () => {
    const req = new PassThrough() as unknown as Req & { end: AnyFn };
    const upload = getMulter().single('tiny');
    const body = 'test';

    req.headers = {
      'content-type': 'multipart/form-data',
      'content-length': String(body.length),
    };

    req.end(body);

    await assert.rejects(promisify(upload)(req, null), hasMessage('Multipart: Boundary not found'));
  });

  it('should report errors from busboy parsing', async () => {
    const req = new PassThrough() as unknown as Req & { end: AnyFn };
    const upload = getMulter().single('tiny');
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

    await assert.rejects(promisify(upload)(req, null), hasMessage('Unexpected end of multipart data'));
  });

  it('should gracefully handle more than one error at a time', async () => {
    const form = new FormData();
    const parser = withLimits({ fileSize: 1, files: 1 }, [{ name: 'small', maxCount: 1 }]);

    form.append('small', util.file('small'));
    form.append('small', util.file('small'));

    await assert.rejects(util.submitForm(parser, form), hasCode('LIMIT_FILE_SIZE'));
  });
});
