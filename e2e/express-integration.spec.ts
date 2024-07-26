import { Server } from 'node:http';
import assert from 'node:assert';
import { promisify } from 'node:util';

import express, { Router, Application } from 'express';
import FormData from 'form-data';
import { getStreamAsBuffer } from 'get-stream';
import _onFinished from 'on-finished';

import * as util from './_util.js';
import multer from '#lib/index.js';
import { AnyFn, Middleware, Req, Res } from '#lib/types.js';

const onFinished = promisify(_onFinished);

const port = 34279;

describe('Express Integration', () => {
  let app: Application;
  let server: Server;

  beforeAll((done) => {
    app = express();
    server = app.listen(port, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  function submitForm(form: FormData, path: string) {
    return new Promise<{ res: Res; body: any }>((resolve, reject) => {
      const req = form.submit(`http://localhost:${port}${path}`);

      req.on('error', reject);
      req.on('response', (res) => {
        res.on('error', reject);

        const body = getStreamAsBuffer(res);
        const finished = onFinished(req);
        const promise = Promise.all([body, finished]).then(([body]) => ({ res, body }));
        resolve(promise as any);
      });
    });
  }

  it('should work with express error handling', async () => {
    const limits = { fileSize: 200 };
    const upload = multer({ limits: limits });
    const router = new (express as any).Router() as Router;
    const form = new FormData();

    let routeCalled = 0;
    let errorCalled = 0;

    form.append('avatar', util.file('large'));

    router.post('/profile', upload.single('avatar'), (req, res, next) => {
      routeCalled++;
      res.status(200).end('SUCCESS');
    });

    router.use((err: any, req: Req, res: Res, next: AnyFn) => {
      assert.strictEqual(err.code, 'LIMIT_FILE_SIZE');

      errorCalled++;
      res.status(500).end('ERROR');
    });

    app.use('/t1', router);

    const result = await submitForm(form, '/t1/profile');

    assert.strictEqual(routeCalled, 0);
    assert.strictEqual(errorCalled, 1);
    assert.strictEqual(result.body.toString(), 'ERROR');
    assert.strictEqual(result.res.statusCode, 500);
  });

  it('should work when uploading a file', async () => {
    const upload = multer();
    const router = new (express as any).Router() as Router;
    const form = new FormData();

    let routeCalled = 0;
    let errorCalled = 0;

    form.append('avatar', util.file('large'));

    router.post('/profile', upload.single('avatar'), (_, res) => {
      routeCalled++;
      res.status(200).end('SUCCESS');
    });

    router.use((_: any, __: any, res: Res, ___: any) => {
      errorCalled++;
      res.status(500).end('ERROR');
    });

    app.use('/t2', router);

    const result = await submitForm(form, '/t2/profile');

    assert.strictEqual(routeCalled, 1);
    assert.strictEqual(errorCalled, 0);
    assert.strictEqual(result.body.toString(), 'SUCCESS');
    assert.strictEqual(result.res.statusCode, 200);
  });
});
