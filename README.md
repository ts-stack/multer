# @ts-stack/multer

Is a node.js library for handling `multipart/form-data`, which is primarily used for uploading files. It is fork of [ExpressJS multer v2.0.0-rc.4][0].

**NOTE**: Multer will not process any form which is not multipart (`multipart/form-data`).

## Installation

```sh
npm install @ts-stack/multer
```

## Usage

Multer returns an object in Promise with four properties: `textFields`, `file`, `files` and `groups`. The `textFields` object contains the values of the text fields of the form, the `file`, `files` or `groups` object contains the files (as `Readable` stream) uploaded via the form.

The following example uses ExpressJS only for simplicity. In fact, `@ts-stack/multer` does not return middleware, so it is less convenient for ExpressJS than the [original module][0]. Basic usage example:

```ts
import { Multer } from '@ts-stack/multer';
import express from 'express';
import { createWriteStream } from 'node:fs';

// Here `avatar`, `photos` and `gallery` - is the names of the field in the HTML form.
const multer = new Multer({ limits: { fileSize: '10MB' } });
const parseAvatar = multer.single('avatar');
const parsePhotos = multer.array('photos', 12);
const parseGroups = multer.groups([
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 },
]);
const app = express();

app.post('/profile', async (req, res, next) => {
  const parsedForm = await parseAvatar(req, req.headers);
  // parsedForm.file is the `avatar` file
  // parsedForm.textFields will hold the text fields, if there were any
  const path = `uploaded-files/${parsedForm.file.originalName}`;
  const writableStream = createWriteStream(path);
  parsedForm.file.stream.pipe(writableStream);
  // ...
});

app.post('/photos/upload', async (req, res, next) => {
  const parsedForm = await parsePhotos(req, req.headers);
  // parsedForm.files is array of `photos` files
  // parsedForm.textFields will contain the text fields, if there were any
  const promises: Promise<void>[] = [];
  parsedForm.files.forEach((file) => {
    const promise = new Promise<void>((resolve, reject) => {
      const path = `uploaded-files/${file.originalName}`;
      const writableStream = createWriteStream(path);
      writableStream.on('error', reject);
      writableStream.on('finish', resolve);
      file.stream.pipe(writableStream);
    });
    promises.push(promise);
  });

  await Promise.all(promises);
  // ...
});

app.post('/cool-profile', async (req, res, next) => {
  const parsedForm = await parseGroups(req, req.headers);
  // parsedForm.groups is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  parsedForm.groups['avatar'][0] -> File
  //  parsedForm.groups['gallery'] -> Array
  //
  // parsedForm.textFields will contain the text fields, if there were any
});
```

In case you need to handle a text-only multipart form, you can use the `.textFields()` method, example:

```ts
import { Multer } from '@ts-stack/multer';
import express from 'express';

const parseFormFields = new Multer().textFields();
const app = express();

app.post('/profile', async (req, res, next) => {
  const parsedForm = await parseFormFields(req, req.headers);
  // parsedForm.textFields contains the text fields
});
```

## Error handling

This is a list of error codes:

```ts
const errorMessages = new Map<ErrorMessageCode, string>([
  ['CLIENT_ABORTED', 'Client aborted'],
  ['LIMIT_FILE_SIZE', 'File too large'],
  ['LIMIT_FILE_COUNT', 'Too many files'],
  ['LIMIT_FIELD_KEY', 'Field name too long'],
  ['LIMIT_FIELD_VALUE', 'Field value too long'],
  ['LIMIT_FIELD_COUNT', 'Too many fields'],
  ['LIMIT_UNEXPECTED_FILE', 'Unexpected file field'],
]);
```

You can see these error codes in the `MulterError#code` property:

```ts
import { Multer, MulterError, ErrorMessageCode } from '@ts-stack/multer';

// ...
try {
  const parse = new Multer().single('avatar');
  const parsedForm = await parse(req, req.headers);
  // ...
} catch (err) {
  if (err instanceof MulterError) {
    err.code; // This property is of type ErrorMessageCode.
    // ...
  }
}
```

[0]: https://github.com/expressjs/multer/tree/v2.0.0-rc.4
