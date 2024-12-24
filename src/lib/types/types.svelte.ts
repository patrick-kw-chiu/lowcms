import type { JSONSchema7 } from 'json-schema';

export type JSONObject = {
	[key: string]: any;
};

export type DatabaseStorageOption = 'all' | 'local' | 'browser';

/**
 * collection = array of objects
 * document = object
 * documentsGroup = group of documents (objects) of the same schema
 */
export type ContentType = 'all' | 'collection' | 'document';

/**
 * Content can be stored in JSON of array-of-objects (collection) or object (document and documentsGroup)
 */
export type ContentDataType = 'array-of-objects' | 'object';

export type StorageOption = 'local';

export type Section = 'databases' | 'templates';

export type GenericEntity = {
	id: string;
	name: string;
	description: string;
	createdAt: Date;
	updatedAt: Date;
	tags: string[];
};

/**
 * Content to be "managed" within a db.
 * It can be a collection, a single document, or a group of documents.
 * @property type - Content type
 */
export type Content = GenericEntity & {
	databaseId: string;
	schemaId: string;
	type: Omit<ContentType, 'all'>;
	filePath: string;
	fileType: string;
	jsonPath?: string;
	fileHandle?: FileSystemFileHandle;
	contentIn?: 'entire-file' | 'specific-field';
	contentJsonInFileType?: ContentDataType;
};

/**
 * Schema are universal (not bound to a db)
 */
export type Schema = Omit<GenericEntity, 'name'> & JSONSchema7;

/**
 * A database points to the user's directory.
 * It consists of "contents to be managed" and their corresponding schema.
 */
export interface DatabaseConfig extends GenericEntity {
	storageOption: 'local' | 'browser';
	directoryHandle?: FileSystemDirectoryHandle; // | FileSystemFileHandle
}

export type DirectoryWithInfo = FileSystemDirectoryHandle & {
	directories?: FileSystemDirectoryHandle[];
	files?: FileSystemFileHandle[];
};

export type StringKeyword = Pick<JSONSchema7, 'minLength' | 'maxLength' | 'pattern'>;

export type LowCMSType =
	| 'string'
	| 'array'
	| 'null'
	| 'number'
	| 'boolean'
	| 'array-of-objects'
	| 'array-of-strings'
	| 'array-empty'
	| 'object'
	| 'unknown';

export type JSONSchema7WithUnknown = JSONSchema7 & { type: 'unknown' };

export type FilterObject = {
	$or?: any;
	$and?: any;
};

export type StringOpType = '$eq' | '$ne' | '$regex';

export type NumberOpType = '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte';

export type RootOpKey = '$and' | '$or';
