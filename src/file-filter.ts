import { MulterError } from './error.js';
import { MulterField, MulterFile } from './types.js';

export function createFileFilter(fields: MulterField[]) {
  const filesLeft = new Map();

  for (const field of fields) {
    if (typeof field.maxCount == 'number') {
      filesLeft.set(field.name, field.maxCount);
    } else {
      filesLeft.set(field.name, Infinity);
    }
  }

  return function fileFilter(file: MulterFile) {
    if (!filesLeft.has(file.fieldName)) {
      throw new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldName);
    }

    const left = filesLeft.get(file.fieldName);

    if (left <= 0) {
      throw new MulterError('LIMIT_FILE_COUNT', file.fieldName);
    }

    filesLeft.set(file.fieldName, left - 1);
  };
}
