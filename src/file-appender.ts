import { MulterFileGroups, Strategy, MulterField, MulterFile } from './types.js';

export function createFileAppender(strategy: Strategy, obj: { file?: any; files?: any }, fields: MulterField[]) {
  switch (strategy) {
    case 'NONE':
      break;
    case 'VALUE':
      obj.file = null;
      break;
    case 'ARRAY':
      obj.files = [];
      break;
    case 'OBJECT':
      obj.files = Object.create(null);
      break;
    default:
      throw new Error(`Unknown file strategy: ${strategy}`);
  }

  if (strategy === 'OBJECT') {
    for (const field of fields) {
      (obj.files as MulterFileGroups)[field.name] = [];
    }
  }

  return function append(file: MulterFile) {
    switch (strategy) {
      case 'VALUE':
        obj.file = file;
        break;
      case 'ARRAY':
        (obj.files as MulterFile[]).push(file);
        break;
      case 'OBJECT':
        (obj.files as MulterFileGroups)[file.fieldName].push(file);
        break;
    }
  };
}
