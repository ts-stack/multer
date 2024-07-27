import fs from 'node:fs';
import { IncomingHttpHeaders } from 'node:http';
import appendField from 'append-field';
import { typeIs } from '@ts-stack/type-is';

import { createFileAppender } from './file-appender.js';
import { readBody } from './read-body.js';
import { AnyFn, SetupOptions, Req } from './types.js';

async function handleRequest(setup: AnyFn<SetupOptions>, req: Req) {
  const options = setup() as SetupOptions;
  const result = await readBody(req, options.limits, options.limitGuard);

  req.body = Object.create(null);

  for (const field of result.fields) {
    appendField(req.body, field.key, field.value);
  }

  const appendFile = createFileAppender(options.fileStrategy, req, options.fields);

  for (const file of result.files) {
    file.stream = fs.createReadStream(file.path);
    file.stream.on('open', () => fs.unlink(file.path, () => {}));

    appendFile(file);
  }
}

export function createMiddleware(setup: AnyFn<SetupOptions>) {
  return function multerMiddleware(req: Req, _: any, next: AnyFn) {
    if (typeIs(req.headers, ['multipart'])) {
      handleRequest(setup, req).then(next, next);
      return;
    }
    return next();
  };
}
