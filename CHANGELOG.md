<a name="1.0.0-beta.6"></a>
# [1.0.0-beta.6](https://github.com/ts-stack/multer/releases/tag/1.0.0-beta.6) (2024-08-01)

### Breaking chages

- Renamed `Multer#none` to `Multer#textFields`.

<a name="1.0.0-beta.5"></a>
## [1.0.0-beta.5](https://github.com/ts-stack/multer/releases/tag/1.0.0-beta.5) (2024-07-31)

### Breaking chages

- Renamed `MulterParsedForm#formFields` to `MulterParsedForm#textFields`.

<a name="1.0.0-beta.4"></a>
## [1.0.0-beta.4](https://github.com/ts-stack/multer/releases/tag/1.0.0-beta.4) (2024-07-30)

### Breaking chages

- Now `maxCount` limit has precedence over `limits.files`.

<a name="1.0.0-beta.3"></a>
## [1.0.0-beta.3](https://github.com/ts-stack/multer/releases/tag/1.0.0-beta.3) (2024-07-30)

### Bug fix

- Fixed [`stream-file-type` issue](https://github.com/LinusU/stream-file-type/pull/6).

<a name="1.0.0-beta.2"></a>
## [1.0.0-beta.2](https://github.com/ts-stack/multer/releases/tag/1.0.0-beta.2) (2024-07-29)

### Bug fix

- Edded `ErrorMessageCode` and `MulterError` to export.
- Fixed `Req` type, now it's just `Readable`.
