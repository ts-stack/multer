import fs from 'node:fs';
import { IncomingHttpHeaders } from 'node:http';
import appendField from 'append-field';
import { hasBody, typeIs } from '@ts-stack/type-is';
import { Readable } from 'node:stream';

import { createFileAppender } from './file-appender.js';
import { readBody } from './read-body.js';
import { AnyFn, SetupOptions, MulterParsedForm } from './types.js';

export function createHandler(setup: AnyFn<SetupOptions>) {
  return async function requestHandler(
    req: Readable,
    headers: IncomingHttpHeaders,
  ): Promise<false | MulterParsedForm | null> {
    if (!hasBody(headers)) {
      return null;
    }
    if (!typeIs(headers, ['multipart'])) {
      return false;
    }
    const options = setup();
    const result = await readBody(req, headers, options.limits, options.limitGuard);

    const parsedForm = Object.create(null) as MulterParsedForm;
    parsedForm.textFields = Object.create(null);

    for (const field of result.fields) {
      appendField(parsedForm.textFields, field.key, field.value);
    }

    const appendFile = createFileAppender(options.fileStrategy, parsedForm, options.groups);

    for (const file of result.files) {
      file.stream = fs.createReadStream(file.path);
      file.stream.on('open', () => fs.unlink(file.path, () => {}));

      appendFile(file);
    }

    return parsedForm;
  };
}
