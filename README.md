# @ts-stack/multer

Is a node.js library for handling `multipart/form-data`, which is primarily used for uploading files. It is fork of [ExpressJS multer v2.0.0-rc.4][0].

**NOTE**: Multer will not process any form which is not multipart (`multipart/form-data`).

## Installation

```sh
npm install @ts-stack/multer
```

## Usage

Multer returns an object with four properties: `formFields`, `file`, `files` and `groups`. The `formFields` object contains the values of the text fields of the form, the `file`, `files` or `groups` object contains the files uploaded via the form.

The following example uses ExpressJS only for simplicity. In fact, `@ts-stack/multer` does not return middleware, so it is less convenient for ExpressJS than the [original module][0]. Basic usage example:

```ts
import { Multer } from '@ts-stack/multer';
import express from 'express';

const multer = new Multer({ limits: { fileSize: '10MB' } });
const parseAvatar = multer.single('avatar');
const parsePhotos = multer.array('photos', 12);
const parseGroups = multer.groups([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }]);
const app = express();

app.post('/profile', async (req, res, next) => {
  const parsedForm = await parseAvatar(req, req.headers);
  // parsedForm.file is the `avatar` file
  // parsedForm.formFields will hold the text fields, if there were any
});

app.post('/photos/upload', async (req, res, next) => {
  const parsedForm = await parsePhotos(req, req.headers);
  // parsedForm.files is array of `photos` files
  // parsedForm.formFields will contain the text fields, if there were any
});

app.post('/cool-profile', async (req, res, next) => {
  const parsedForm = await parseGroups(req, req.headers);
  // parsedForm.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  parsedForm.files['avatar'][0] -> File
  //  parsedForm.files['gallery'] -> Array
  //
  // parsedForm.formFields will contain the text fields, if there were any
});
```

In case you need to handle a text-only multipart form, you can use the `.none()` method, example:

```ts
import { Multer } from '@ts-stack/multer';
import express from 'express';

const parseFormFields = new Multer().none();
const app = express();

app.post('/profile', async (req, res, next) => {
  const parsedForm = await parseFormFields(req, req.headers);
  // parsedForm.formFields contains the text fields
});
```

[0]: https://github.com/expressjs/multer/tree/v2.0.0-rc.4
