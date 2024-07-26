const errorMessages = new Map<ErrorMessageCode, string>([
  ['CLIENT_ABORTED', 'Client aborted'],
  ['LIMIT_FILE_SIZE', 'File too large'],
  ['LIMIT_FILE_COUNT', 'Too many files'],
  ['LIMIT_FIELD_KEY', 'Field name too long'],
  ['LIMIT_FIELD_VALUE', 'Field value too long'],
  ['LIMIT_FIELD_COUNT', 'Too many fields'],
  ['LIMIT_UNEXPECTED_FILE', 'Unexpected file field'],
]);

export type ErrorMessageCode =
  | 'CLIENT_ABORTED'
  | 'LIMIT_FILE_SIZE'
  | 'LIMIT_FILE_COUNT'
  | 'LIMIT_FIELD_KEY'
  | 'LIMIT_FIELD_VALUE'
  | 'LIMIT_FIELD_COUNT'
  | 'LIMIT_UNEXPECTED_FILE';

export class MulterError extends Error {
  code: ErrorMessageCode;
  field: string;

  constructor(code: ErrorMessageCode, optionalField?: string) {
    super(errorMessages.get(code));

    this.code = code;
    this.name = this.constructor.name;
    if (optionalField) this.field = optionalField;

    Error.captureStackTrace(this, this.constructor);
  }
}
