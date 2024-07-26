import { FilesInObject, FileStrategy, MulterField, MulterFile, Req } from './types.js';

export default function createFileAppender(strategy: FileStrategy, req: Req, fields: MulterField[]) {
  switch (strategy) {
    case 'NONE':
      break;
    case 'VALUE':
      req.file = null;
      break;
    case 'ARRAY':
      req.files = [];
      break;
    case 'OBJECT':
      req.files = Object.create(null);
      break;
    /* c8 ignore next */
    default:
      throw new Error(`Unknown file strategy: ${strategy}`);
  }

  if (strategy === 'OBJECT') {
    for (const field of fields) {
      (req.files as FilesInObject)[field.name] = [];
    }
  }

  return function append(file: MulterFile) {
    switch (strategy) {
      case 'VALUE':
        req.file = file;
        break;
      case 'ARRAY':
        (req.files as MulterFile[]).push(file);
        break;
      case 'OBJECT':
        (req.files as FilesInObject)[file.fieldName].push(file);
        break;
    }
  };
}
