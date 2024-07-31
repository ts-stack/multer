import { Strategy, MulterGroup, MulterFile, MulterParsedForm } from './types.js';

export function createFileAppender(strategy: Strategy, obj: MulterParsedForm, groups: MulterGroup[]) {
  switch (strategy) {
    case 'NONE':
      break;
    case 'VALUE':
      obj.file = Object.create(null) as any;
      break;
    case 'ARRAY':
      obj.files = [];
      break;
    case 'OBJECT':
      obj.groups = Object.create(null);
      break;
    default:
      throw new Error(`Unknown file strategy: ${strategy}`);
  }

  if (strategy === 'OBJECT') {
    for (const group of groups) {
      obj.groups[group.name] = [];
    }
  }

  return function append(file: MulterFile) {
    switch (strategy) {
      case 'VALUE':
        obj.file = file;
        break;
      case 'ARRAY':
        obj.files.push(file);
        break;
      case 'OBJECT':
        obj.groups[file.fieldName].push(file);
        break;
    }
  };
}
