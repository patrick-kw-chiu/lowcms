import type { ContentType, DatabaseStorageOption, LowCMSType } from '$lib/types/types.svelte';
import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';

export const BASE_PATH = 'lowcms';

export const LANGUAGE_LABEL = {
	en: 'English',
	zh: '中文'
};

export const SECTIONS = [
	{
		path: '/databases',
		inlangId: 'databases',
		disabled: false
	},
	{
		path: '#',
		inlangId: 'templates',
		disabled: true
	}
];

export const DATABASE_SECTIONS = [
	// {
	// 	path: '/overview',
	// 	inlangId: 'overview'
	// },
	{
		path: '/schema',
		inlangId: 'schema'
	},
	{
		path: '/content',
		inlangId: 'content'
	}
];

export const DATABASE_STORAGE_OPTIONS: DatabaseStorageOption[] = ['all', 'local', 'browser'];

export const CONTENT_TYPES: ContentType[] = [
	'all',
	'collection',
	'document'
	// 'documentsGroup'
];

export const BASE_SCHEMA: JSONSchema7 = {
	$id: '',
	title: '',
	description: '',
	type: 'object',
	properties: {}
};

export const TYPE_TO_JSON_TYPE_MAP: Record<LowCMSType, JSONSchema7TypeName | 'unknown'> = {
	string: 'string',
	number: 'number',
	boolean: 'boolean',
	object: 'object',
	array: 'array',
	'array-of-objects': 'array',
	'array-of-strings': 'array',
	// 'array-empty': 'array',
	null: 'null',
	unknown: 'unknown'
};

export const UNSUPPORTED_TYPES = ['array', 'unknown', 'null'];

export const OpTypeToLabelMap: Record<string, string> = {
	$eq: 'equal to',
	$ne: 'not equal to',
	$regex: 'contain (case-insensitive)',
	$in: 'in',
	$gt: 'greater than',
	$gte: 'greater than or equal to',
	$lt: 'less than',
	$lte: 'less than or equal to',
	$exists: 'exist'
};

export const StringFilterOperatorOptions = [
	{ label: 'equal to', value: '$eq' },
	{ label: 'not equal to', value: '$ne' },
	{ label: 'contain (case-insensitive)', value: '$regex' }
];

export const NumberFilterOperatorOptions = [
	{ label: 'equal to', value: '$eq' },
	{ label: 'not equal to', value: '$ne' },
	{ label: 'greater than', value: '$gt' },
	{ label: 'greater than or equal to', value: '$gte' },
	{ label: 'less than', value: '$lt' },
	{ label: 'less than or equal to', value: '$lte' }
];

export const NUMERIC_KEYWORDS = [
	'multipleOf',
	'minimum',
	'maximum',
	'exclusiveMinimum',
	'exclusiveMaximum'
];

export const FIELD = {
	types: [
		'string',
		'number',
		'integer',
		'boolean',
		'array',
		'object',
		'null',
		'x_id_uuid',
		'x_id_nanoid',
		'x_relationship_one_to_one',
		'x_relationship_one_to_many'
	] as JSONSchema7TypeName[],
	string: {
		keywords: ['enum', 'minLength', 'maxLength', 'pattern'],
		customTypes: [
			'ID - uuid',
			'ID - nanoid'
			// 'email', 'url', 'date', 'datetime', 'time'
		]
	},
	number: {
		keywords: NUMERIC_KEYWORDS
	},
	integer: {
		keywords: NUMERIC_KEYWORDS
	},
	boolean: {
		keywords: []
	},
	array: {
		keywords: ['items']
	},
	object: {
		keywords: []
	},
	null: {
		keywords: []
	},
	unknown: {
		keywords: []
	},
	x_id_uuid: {
		keywords: []
	},
	x_id_nanoid: {
		keywords: []
	},
	x_relationship_one_to_one: {
		keywords: ['x-content-id', 'x-id-field']
	},
	x_relationship_one_to_many: {
		keywords: ['x-content-id', 'x-id-field']
	}
};
