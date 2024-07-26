import { Readable } from 'node:stream';
import type { Request, Response } from 'express';

export type Middleware = (req: Req, res: any, next: AnyFn) => void;
export interface FilesInObject {
  [key: string]: MulterFile[];
}
export interface Req extends Request {
  files?: MulterFile[] | FilesInObject;
  file?: MulterFile | null;
}
export type Res = Response;
export type AnyFn<T = any> = (...args: any[]) => T;
export type FileStrategy = 'NONE' | 'VALUE' | 'ARRAY' | 'OBJECT';

/**
 * a function to control which files should be uploaded and which should be skipped
 * pass a boolean to indicate if the file should be accepted
 * pass an error if something goes wrong
 */
export interface MulterFileFilter {
  (file: MulterFile): void;
}

export interface MulterLimits {
  /** Maximum size of each form field name in bytes. (Default: 100) */
  fieldNameSize?: number;
  /** Maximum size of each form field value in bytes. (Default: 1048576) */
  fieldSize?: number;
  /** Maximum number of non-file form fields. (Default: Infinity) */
  fields?: number;
  /** Maximum size of each file in bytes. (Default: Infinity) */
  fileSize?: number;
  /** Maximum number of file fields. (Default: Infinity) */
  files?: number;
  /** Maximum number of parts (non-file fields + files). (Default: Infinity) */
  parts?: number;
  /** Maximum number of headers. (Default: 2000) */
  headerPairs?: number;
}

/** Options for initializing a Multer instance. */
export interface MulterOptions {
  /**
   * A `StorageEngine` responsible for processing files uploaded via Multer.
   * Takes precedence over `dest`.
   */
  storage?: any;
  /**
   * The destination directory for uploaded files. If `storage` is not set
   * and `dest` is, Multer will create a `DiskStorage` instance configured
   * to store files at `dest` with random filenames.
   *
   * Ignored if `storage` is set.
   */
  dest?: string;
  /**
   * An object specifying various limits on incoming data. This object is
   * passed to Busboy directly, and the details of properties can be found
   * at https://github.com/mscdex/busboy#busboy-methods.
   */
  limits?: MulterLimits;
  /** Preserve the full path of the original filename rather than the basename. (Default: false) */
  preservePath?: boolean;
  /**
   * Optional function to control which files are uploaded. This is called
   * for every file that is processed.
   */
  fileFilter?: MulterFileFilter;
  fileStrategy?: FileStrategy;
}

export interface DiskStorageOptions {
  /**
   * A string or function that determines the destination path for uploaded
   * files. If a string is passed and the directory does not exist, Multer
   * attempts to create it recursively. If neither a string or a function
   * is passed, the destination defaults to `os.tmpdir()`.
   *
   * @param req The Express `Req` object.
   * @param file Object containing information about the processed file.
   * @param callback Callback to determine the destination path.
   */
  destination?:
    | string
    | ((req: Req, file: MulterFile, callback: (error: Error | null, destination?: string) => void) => void);
  /**
   * A function that determines the name of the uploaded file. If nothing
   * is passed, Multer will generate a 32 character pseudorandom hex string
   * with no extension.
   *
   * @param req The Express `Req` object.
   * @param file Object containing information about the processed file.
   * @param callback Callback to determine the name of the uploaded file.
   */
  filename?(req: Req, file: MulterFile, callback: (error: Error | null, filename: string) => void): void;
}

/**
 * An object describing a field name and the maximum number of files with
 * that field name to accept.
 */
export interface MulterField {
  /** The field name. */
  name: string;
  /** Optional maximum number of files per field to accept. (Default: Infinity) */
  maxCount?: number;
}

/** Object containing file metadata and access information. */
export interface MulterFile {
  extension: string;
  hash: string;
  detectedMimeType: string | null;
  detectedFileExtension: string;
  originalName: string;
  clientReportedMimeType: string;
  clientReportedFileExtension: string;
  /** Name of the form field associated with this file. */
  fieldName: string;
  /** Name of the file on the uploader's computer. */
  originalname: string;
  /**
   * Value of the `Content-Transfer-Encoding` header for this file.
   * @deprecated since July 2015
   * @see RFC 7578, Section 4.7
   */
  encoding: string;
  /** Value of the `Content-Type` header for this file. */
  mimetype: string;
  /** Size of the file in bytes. */
  size: number;
  /**
   * A readable stream of this file. Only available to the `_handleFile`
   * callback for custom `StorageEngine`s.
   */
  stream: Readable;
  /** `DiskStorage` only: Directory to which this file has been uploaded. */
  destination: string;
  /** `DiskStorage` only: Name of this file within `destination`. */
  filename: string;
  /** `DiskStorage` only: Full path to the uploaded file. */
  path: string;
  /** `MemoryStorage` only: A Buffer containing the entire file. */
  buffer: Buffer;
}
