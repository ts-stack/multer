import { PassThrough } from 'node:stream';

import FormData from 'form-data';
// @ts-ignore
import testData from 'testdata-w3c-json-form';

import * as util from './_util.js';
import { Multer } from '#lib/multer.js';
import { AnyFn, MulterParsedForm, ParserFn, Req } from '#lib/types.js';

describe('body', () => {
  let parser: ParserFn;

  beforeAll(() => {
    parser = new Multer().none();
  });

  it('should process multiple fields', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('key', 'value');
    form.append('abc', 'xyz');

    const filesWithMetadata = await util.submitForm(parser, form);

    expect(filesWithMetadata.formFields).toMatchObject({
      name: 'Multer',
      key: 'value',
      abc: 'xyz',
    });
  });

  it('should process empty fields', async () => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('key', '');
    form.append('abc', '');
    form.append('checkboxfull', 'cb1');
    form.append('checkboxfull', 'cb2');
    form.append('checkboxhalfempty', 'cb1');
    form.append('checkboxhalfempty', '');
    form.append('checkboxempty', '');
    form.append('checkboxempty', '');

    const filesWithMetadata = await util.submitForm(parser, form);

    expect(filesWithMetadata.formFields).toMatchObject({
      name: 'Multer',
      key: '',
      abc: '',
      checkboxfull: ['cb1', 'cb2'],
      checkboxhalfempty: ['cb1', ''],
      checkboxempty: ['', ''],
    });
  });

  it('should not process non-multipart POST request', async () => {
    const req = new PassThrough() as unknown as Req & { end: AnyFn };

    req.end('name=Multer');
    req.method = 'POST';
    req.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': '11',
    };

    const filesWithMetadata = await parser(req, req.headers) as MulterParsedForm;

    expect(filesWithMetadata.formFields).toBeUndefined();
    expect(filesWithMetadata.files).toBeUndefined();
  });

  it('should not process non-multipart GET request', async () => {
    const req = new PassThrough() as unknown as Req & { end: AnyFn };

    req.end('name=Multer');
    req.method = 'GET';
    req.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': '11',
    };

    const filesWithMetadata = await parser(req, req.headers) as MulterParsedForm;

    expect(filesWithMetadata.formFields).toBeUndefined();
    expect(filesWithMetadata.files).toBeUndefined();
  });

  for (const test of testData) {
    it(`should handle ${test.name}`, async () => {
      const form = new FormData();

      for (const field of test.fields) {
        form.append(field.key, field.value);
      }

      const filesWithMetadata = await util.submitForm(parser, form);

      expect(filesWithMetadata.formFields).toMatchObject(test.expected);
    });
  }

  it('should convert arrays into objects', async () => {
    const form = new FormData();

    form.append('obj[0]', 'a');
    form.append('obj[2]', 'c');
    form.append('obj[x]', 'yz');

    const filesWithMetadata = await util.submitForm(parser, form);

    expect(filesWithMetadata.formFields).toMatchObject({
      obj: {
        0: 'a',
        2: 'c',
        x: 'yz',
      },
    });
  });
});
