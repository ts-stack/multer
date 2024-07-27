# @ts-stack/multer

Is a node.js library for handling `multipart/form-data`, which is primarily used for uploading files. It is fork of [ExpressJS multer v2.0.0-rc.4](https://github.com/expressjs/multer/tree/explore-new-api).

**NOTE**: Multer will not process any form which is not multipart (`multipart/form-data`).

## Installation

```sh
npm install @ts-stack/multer
```

## Usage

Multer an object with three properties: `fields`, `file` or `files`. The `fields` object contains the values of the text fields of the form, the `file` or `files` object contains the files uploaded via the form.

Basic usage example:

```ts
import { Multer } from '@ts-stack/multer';
import express from 'express';

const app = express();
const upload = new Multer();

app.post('/profile', upload.single('avatar'), (req, res, next) => {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
});

app.post('/photos/upload', upload.array('photos', 12), (req, res, next) => {
  // req.files is array of `photos` files
  // req.body will contain the text fields, if there were any
});

const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }]);
app.post('/cool-profile', cpUpload, (req, res, next) => {
  // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body will contain the text fields, if there were any
});
```

In case you need to handle a text-only multipart form, you can use the `.none()` method, example:

```ts
import { Multer } from '@ts-stack/multer';
import express from 'express';

const app = express();
const upload = new Multer();

app.post('/profile', upload.none(), (req, res, next) => {
  // req.body contains the text fields
});
```
