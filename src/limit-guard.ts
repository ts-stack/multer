import { MulterError } from './error.js';
import { MulterGroup, MulterFile } from './types.js';

export function createLimitGuard(groups: MulterGroup[]) {
  const filesLeft = new Map();

  for (const group of groups) {
    if (typeof group.maxCount == 'number') {
      filesLeft.set(group.name, group.maxCount);
    } else {
      filesLeft.set(group.name, Infinity);
    }
  }

  return function limitGuard(file: MulterFile) {
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
