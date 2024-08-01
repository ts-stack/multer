import { Readable } from 'node:stream';
import { IncomingHttpHeaders, ServerResponse } from 'node:http';

export type MulterFileGroups<G extends string = string> = {
  [key in G]: MulterFile[];
}
export type Req = Readable;
export type Res = ServerResponse;
export type AnyFn<T = any> = (...args: any[]) => T;
export type Strategy = 'NONE' | 'VALUE' | 'ARRAY' | 'OBJECT';

export interface MulterParser<F extends object = any, G extends string = string> {
  (req: Req, headers: IncomingHttpHeaders): Promise<false | MulterParsedForm<F, G> | null>;
}

export interface MulterParsedForm<F extends object = any, G extends string = string> {
  /**
   * Contains the values of the text fields of the form.
   */
  textFields: F;
  groups: MulterFileGroups<G>;
  files: MulterFile[];
  file: MulterFile;
}

export interface SetupOptions {
  groups: MulterGroup[];
  limits: NormalizedLimits;
  limitGuard: LimitGuard;
  fileStrategy: Strategy;
}

/**
 * a function to control which files should be uploaded and which should be skipped
 * pass a boolean to indicate if the file should be accepted
 * pass an error if something goes wrong
 */
export interface LimitGuard {
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
   * Max number of bytes per field name. (Default `'100B'`)
   */
  fieldNameSize?: number | string;
  /**
   * Max number of bytes per field value. (Default `'8KB'`)
   */
  fieldSize?: number | string;
  /**
   * Max number of non-file fields per request. (Default `1000`)
   */
  fields?: number;
  /**
   * Max number of bytes per file. (Default `'8MB'`)
   */
  fileSize?: number | string;
  /**
   * Max number of files per request. (Default `10`)
   */
  files?: number;
  /**
   * Max number of header key-value pairs. (Default `2000`, same as Node's http)
   */
  headerPairs?: number;
}

export interface NormalizedLimits extends Required<MulterLimits> {
  fieldNameSize: number;
  fieldSize: number;
  fileSize: number;
}

/**
 * Options for initializing a Multer instance.
 */
export class MulterOptions {
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
export interface MulterGroup<G extends string = string> {
  /**
   * The field name.
   */
  name: G;
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
