import { Readable } from 'node:stream';
import type { Request, Response } from 'express';

export type Middleware = (req: Req, res: any, next: AnyFn) => void;
export interface MulterFilesInObject {
  [key: string]: MulterFile[];
}
export interface Req extends Request {
  files?: MulterFile[] | MulterFilesInObject;
  file?: MulterFile | null;
}
export type Res = Response;
export type AnyFn<T = any> = (...args: any[]) => T;
export type MulterStrategy = 'NONE' | 'VALUE' | 'ARRAY' | 'OBJECT';

/**
 * a function to control which files should be uploaded and which should be skipped
 * pass a boolean to indicate if the file should be accepted
 * pass an error if something goes wrong
 */
export interface MulterFileFilter {
  (file: MulterFile): void;
}

/**
 * An object specifying the size limits of the optional properties.
 * Multer passes this object into busboy directly, and the details of the properties
 * can be found on [busboy's page](https://github.com/mscdex/busboy#busboy-methods).
 * 
 * Bytes limits can be passed either as a `number`, or as a `string` with an appropriate prefix.
 * Specifying the limits can help protect your site against denial of service (DoS) attacks.
 */
export interface MulterLimits {
  /**
   * Maximum size of each form field name in bytes. (Default: 100).
   */
  fieldNameSize?: number;
  /**
   * Maximum size of each form field value in bytes. (Default: 1048576).
   */
  fieldSize?: number;
  /**
   * Maximum number of non-file form fields. (Default: Infinity).
   */
  fields?: number;
  /**
   * Maximum size of each file in bytes. (Default: Infinity).
   */
  fileSize?: number;
  /**
   * Maximum number of file fields. (Default: Infinity).
   */
  files?: number;
  /**
   * Maximum number of headers. (Default: 2000).
   */
  headerPairs?: number;
}

/**
 * Options for initializing a Multer instance.
 */
export interface MulterOptions {
  /**
   * An object specifying the size limits of the optional properties.
   * Multer passes this object into busboy directly, and the details of the properties
   * can be found on [busboy's page](https://github.com/mscdex/busboy#busboy-methods).
   */
  limits?: MulterLimits;
}

/**
 * An object describing a field name and the maximum number of files with
 * that field name to accept.
 */
export interface MulterField {
  /**
   * The field name.
   */
  name: string;
  /**
   * Optional maximum number of files per field to accept. (Default: Infinity).
   */
  maxCount?: number;
}

/**
 * File information.
 */
export interface MulterFile {
  path: string;
  extension: string;
  hash: string;
  /**
   * Field name specified in the form.
   */
  fieldName: string;
  /**
   * Name of the file on the user's computer (`undefined` if no filename was supplied by the client).
   */
  originalName: string;
  /**
   * Total size of the file in bytes.
   */
  size: number;
  /**
   * Readable stream of file data.
   */
  stream: Readable;
  /**
   * The detected mime-type, or null if we failed to detect.
   */
  detectedMimeType: string | null;
  /**
   * The typical file extension for files of the detected type,
   * or empty string if we failed to detect (with leading `.` to match `path.extname`)
   */
  detectedFileExtension: string;
  /**
   * The mime type reported by the client using the `Content-Type` header,
   * or null if the header was absent.
   */
  clientReportedMimeType: string | null;
  /**
   * The extension of the file uploaded (as reported by `path.extname`).
   */
  clientReportedFileExtension: string;
}
