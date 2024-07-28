import fs from 'node:fs';
import { IncomingHttpHeaders } from 'node:http';
import appendField from 'append-field';
import { hasBody, typeIs } from '@ts-stack/type-is';

import { createFileAppender } from './file-appender.js';
import { readBody } from './read-body.js';
import { AnyFn, SetupOptions, Req, MulterParsedForm } from './types.js';

export function createHandler(setup: AnyFn<SetupOptions>) {
  return async function multerHandler(
    req: Req,
    headers: IncomingHttpHeaders,
  ): Promise<false | MulterParsedForm | null> {
    if (!hasBody(headers)) {
      return null;
    }
    if (!typeIs(headers, ['multipart'])) {
      return false;
    }
    const options = setup();
    const result = await readBody(req, options.limits, options.limitGuard);

    const filesWithMetadata = Object.create(null) as MulterParsedForm;
    filesWithMetadata.formFields = Object.create(null);

    for (const field of result.fields) {
      appendField(filesWithMetadata.formFields, field.key, field.value);
    }

    const appendFile = createFileAppender(options.fileStrategy, filesWithMetadata, options.fields);

    for (const file of result.files) {
      file.stream = fs.createReadStream(file.path);
      file.stream.on('open', () => fs.unlink(file.path, () => {}));

      appendFile(file);
    }

    return filesWithMetadata;
  };
}
