import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
import type { Page } from '@sveltejs/kit';

import { availableLanguageTags } from '$lib/paraglide/runtime.js';
import * as m from '$lib/paraglide/messages';

import type {
	DirectoryWithInfo,
	JSONObject,
	JSONSchema7WithUnknown,
	LowCMSType,
	Section
} from '$lib/types/types.svelte';

import {
	BASE_PATH,
	BASE_SCHEMA,
	JSON_SCHEMA,
	TYPE_TO_JSON_TYPE_MAP
} from '$lib/constants/constants.svelte';

export const cap = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const setState = (state: JSONObject, newState: JSONObject) => {
	for (const key in newState) {
		state[key] = newState[key];
	}
};

export const getQueryString = (obj: JSONObject) => {
	// remove nil field
	const _obj = pick(
		obj,
		Object.keys(obj).filter((key) => obj[key] !== undefined)
	);
	const queryString = new URLSearchParams(_obj).toString();
	return queryString ? `?${queryString}` : '';
};

export const getSectionInfoByPage = (page: Page) => {
	const sections = (page.route.id ?? '').split('/');

	const sectionName = sections[1] as Section;
	const isSubSection = !!sections[2];
	console.log({ page, sections, sectionName, isSubSection });
	const breadcrumbItems = sections
		.map((section, index) => {
			if (index === 0) {
				return {
					name: m.lowcms(),
					path: '/'
				};
			}

			if (index === 1) {
				if (sectionName === 'databases') {
					return {
						name: cap(m.databases()),
						path: `/${BASE_PATH}/databases`
					};
				}
			}

			if (index === 2) {
				if (sectionName === 'databases') {
					// Get DB name from dexie
					return {
						name: undefined,
						path: undefined
					};
				}
			}

			if (!section) {
				return {
					name: undefined,
					path: undefined
				};
			}

			console.log({ section });

			return {
				// @ts-ignore
				name: cap(m[section]?.() ?? ''),
				path: `/${BASE_PATH}/${sections
					.filter((s) => s)
					.slice(0, index)
					.join('/')}${window.location.search}`
			};
		})
		.filter((section) => section.name !== undefined);

	return {
		name: sectionName,
		isSubSection,
		breadcrumbItems
	};
};

export const getLanguageByUrl = (url: string) => {
	// const availableLanguageTags = ['en', 'zh'];
	for (let i = 0; i < availableLanguageTags.length; i++) {
		const language = availableLanguageTags[i];
		if (url.endsWith(`/${language}`) || url.includes(`/${language}/`)) {
			return language;
		}
	}

	return '';
};

export const enumerateDirectory = async (directory: FileSystemDirectoryHandle) => {
	let directories: DirectoryWithInfo[] = [];
	let files: FileSystemFileHandle[] = [];

	// Classify to directories and files
	for await (const entry of directory.values()) {
		if (entry.kind === 'directory') {
			directories.push(entry);
		} else {
			files.push(entry);
		}
	}

	// Sort asc
	directories = directories.sort((a, b) => (a.name > b.name ? 1 : -1));
	files = files.sort((a, b) => (a.name > b.name ? 1 : -1));

	return { directories, files };
};

const options = { mode: 'readwrite' as FileSystemPermissionMode };
export const queryPermission = async (directoryHandle: FileSystemDirectoryHandle) => {
	// Check if permission was already granted. If so, return true.
	if ((await directoryHandle.queryPermission(options)) === 'granted') {
		return true;
	}
	// The user didn't grant permission, so return false.
	return false;
};
export const requestPermission = async (directoryHandle: FileSystemDirectoryHandle) => {
	// Request permission. If the user grants permission, return true.
	if ((await directoryHandle.requestPermission(options)) === 'granted') {
		return true;
	}
	// The user didn't grant permission, so return false.
	return false;
};

export const checkIsJsonObject = (value: unknown) => {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Get LowCMS specific type by value, which is a superset of JSON schema type
 * @param value
 * @param options
 * @returns
 */
export const getLowCMSTypeByValue = (value: unknown) => {
	if (value === null) {
		return 'null';
	}
	if (typeof value === 'string') {
		return 'string';
	}
	if (typeof value === 'number') {
		return 'number';
	}
	if (typeof value === 'boolean') {
		return 'boolean';
	}
	if (Array.isArray(value)) {
		if (value.length === 0) {
			// return 'array-empty';
			return 'unknown';
		}
		if (checkIsJsonObject(value[0])) {
			return 'array-of-objects';
		}
		if (value.every((v) => typeof v === 'string')) {
			return 'array-of-strings';
		}
		return 'array';
	}
	if (checkIsJsonObject(value)) {
		return 'object';
	}

	return 'unknown';
};

/**
 * Get JSON schema type by value
 * @param value
 * @returns JSONSchema7TypeName
 */
export const getJSONSchemaTypeByValue = (value: unknown) => {
	if (value === null) {
		return 'null';
	}
	if (typeof value === 'string') {
		return 'string';
	}
	if (typeof value === 'number') {
		return 'number';
	}
	if (typeof value === 'boolean') {
		return 'boolean';
	}
	if (Array.isArray(value)) {
		return 'array';
	}
	if (checkIsJsonObject(value)) {
		return 'object';
	}
	return 'null';
};

export const getLowCMSTypeByConfig = (config: JSONSchema7) => {
	if (config.type === 'array') {
		return `array-of-${(config.items as JSONSchema7).type}s`;
	}
	return config.type as string;
};

// TODO: check unknown and null
export const convertLowCMSTypeToJSONSchemaType = (type: LowCMSType) => {
	return TYPE_TO_JSON_TYPE_MAP[type] ?? 'unknown';
};

export const checkIsSelectableField = (value: unknown) => {
	const type = getLowCMSTypeByValue(value);
	return ['array-of-objects', 'object'].includes(type);
};

export const countOccurance = (array: string[], value: string) => {
	let count = 0;
	for (const element of array) {
		if (element === value) {
			count++;
		}
	}
	return count;
};

export const getMostOccurance = (array: LowCMSType[]) => {
	const counts: { [key: string]: number } = {};
	let maxCount = 0;
	let mostFrequent: LowCMSType;

	for (const element of array) {
		counts[element] = (counts[element] || 0) + 1;
		if (counts[element] > maxCount) {
			maxCount = counts[element];
			mostFrequent = element;
		}
	}

	return mostFrequent!;
};

/**
 * Represents a "Nil-ish" value, which can be null or undefined.
 */
type Nil = null | undefined;

/**
 * Reduces an array of objects into a single object based on specific merging rules.
 *
 * @template T - The type of the objects in the array.
 * @param {T[]} arr - The array of objects to reduce.
 * @returns {T} - The reduced object.
 */
export function reduceObjects<T extends Record<string, any>>(arr: T[]): T {
	if (!Array.isArray(arr) || arr.length === 0) {
		return {} as T;
	}

	return arr.reduce((accumulator, currentObject) => {
		// Iterate over the keys of the current object in the array.
		(Object.keys(currentObject) as Array<keyof T>).forEach((key) => {
			const accumulatorValue = accumulator[key];
			const currentValue = currentObject[key];

			if (currentValue === null || currentValue === undefined) {
				if (accumulator[key] === undefined) {
					accumulator[key] = currentValue;
				}
				return;
			}

			// If the accumulator's value for the key is an array, concatenate the current value.
			if (Array.isArray(accumulatorValue)) {
				accumulator[key] = accumulatorValue.concat(currentValue);
			} else if (accumulatorValue === null || accumulatorValue === undefined) {
				// If the accumulator's value is "Nil-ish", override it with the current value.
				accumulator[key] = currentValue;
			}
			// If the accumulator's value is not an array and not "Nil-ish", do nothing to keep the original value.
		});

		return accumulator;
	}, {} as T);
}

/**
 * Derive JSON schema
 */
export const deriveJSONSchema = (object: JSONObject | JSONObject[], nestedSchema?: JSONObject) => {
	const _schema = nestedSchema ?? JSON.parse(JSON.stringify(BASE_SCHEMA));
	if (getLowCMSTypeByValue(object) === 'object') {
		for (const key in object as JSONObject) {
			// If includes "." dot => not valid
			const isValidKey = new RegExp('^[^.]*$').test(key);
			if (!isValidKey) {
				continue;
			}

			const value = (object as JSONObject)[key];
			const type = getLowCMSTypeByValue(value);
			const jsonSchemaType = convertLowCMSTypeToJSONSchemaType(type);

			// 1. Apply default keyword fields
			_schema.properties[key] = JSON_SCHEMA[jsonSchemaType as JSONSchema7TypeName].keywords.reduce(
				(prev, curr) => ({ ...prev, [curr]: undefined }),
				{}
			);

			// 2. Apply type specific handling
			if (['array', 'unknown'].includes(type)) {
				// Do nothing - handle array as `unknown`
				_schema.properties[key] = {
					..._schema.properties[key],
					type: 'unknown'
				};
			} else if (['array-of-objects'].includes(type)) {
				_schema.properties[key] = {
					..._schema.properties[key],
					type: 'array',
					items: {
						type: 'object',
						...deriveJSONSchema(value, { properties: {} })
					}
				};
			} else if (['array-of-strings'].includes(type)) {
				const uniqueItems = [...new Set(value)];
				_schema.properties[key] = {
					..._schema.properties[key],
					type: 'array',
					items: { type: 'string', enum: uniqueItems }
				};
			} else {
				_schema.properties[key] = {
					..._schema.properties[key],
					type
				};

				if (['object'].includes(type)) {
					_schema.properties[key] = deriveJSONSchema(value, {
						..._schema.properties[key],
						properties: {}
					});
				}
			}
		}
	} else {
		const array = object as JSONObject[];
		const typeMap: JSONObject = {};
		const valueMap: JSONObject = {};

		// 1. Summarizes the types (and string values) of the properties
		for (let i = 0; i < array.length; i++) {
			const _object = array[i];

			for (const key in _object as JSONObject) {
				// If includes "." dot => not valid
				const isValidKey = new RegExp('^[^.]*$').test(key);
				if (!isValidKey) {
					continue;
				}

				const value = (_object as JSONObject)[key];
				const type = getLowCMSTypeByValue(value);

				// typeMap
				if (!typeMap[key]) {
					typeMap[key] = [type];
				}
				typeMap[key].push(type);

				// valueMap
				if (!valueMap[key]) {
					valueMap[key] = [];
				}

				if (type === 'string') {
					valueMap[key].push(value);
				} else if (type === 'array-of-strings') {
					valueMap[key].push(...value);
				}
			}
		}

		console.log({ typeMap, valueMap });

		// Based on occurance...
		// if most are array, handle as `any`
		// if most are non JSON_SCHEMA_TYPES
		// => those are values and type is string
		// => see if we can suggest the values as enum
		for (const key in typeMap) {
			// types is the count of detected types of the field

			const isOnlyContainsEmptyArray =
				new Set(typeMap[key] as string[]).values().next().value === 'array-empty';

			const types = isOnlyContainsEmptyArray
				? ['unknown']
				: typeMap[key].filter((t: string) => t !== 'array-empty');

			const mostOccuredType = getMostOccurance(types);
			const jsonSchemaType = convertLowCMSTypeToJSONSchemaType(mostOccuredType);
			console.log({ key, types, mostOccuredType, jsonSchemaType });

			// 1. Apply default keyword fields
			_schema.properties[key] = {
				..._schema.properties[key],
				...JSON_SCHEMA[jsonSchemaType as JSONSchema7TypeName].keywords.reduce(
					(prev, curr) => ({ ...prev, [curr]: undefined }),
					{}
				)
			};

			// 2. Apply type specific handling
			if (['array-of-objects'].includes(mostOccuredType!)) {
				const objects = array.flatMap((obj) => obj[key]).filter((obj) => Boolean(obj));
				console.log({ key, objects, array });
				const reducedObject = reduceObjects(objects);
				console.log({ reducedObject });
				_schema.properties[key] = {
					..._schema.properties[key],
					type: 'array',
					items: {
						type: 'object',
						...deriveJSONSchema(reducedObject, { properties: {} })
					}
				};
			} else if (['array', 'unknown'].includes(mostOccuredType!)) {
				_schema.properties[key] = {
					..._schema.properties[key],
					type: 'unknown'
				};
			} else if (['array-of-strings'].includes(mostOccuredType!)) {
				_schema.properties[key] = {
					..._schema.properties[key],
					type: 'array',
					items: {
						type: 'string',
						enum: [...new Set(valueMap[key])]
					}
				};
			} else if (['string'].includes(mostOccuredType!)) {
				_schema.properties[key] = {
					..._schema.properties[key],
					type: 'string'
				};

				// If there are limited unique items, suggest that it could be `enum` to users
				const uniqueItems = [...new Set(types)];
				const numOfUniqueItems = uniqueItems.length;
				console.log({ 'types.length': types.length, numOfUniqueItems });
				if (Math.sqrt(types.length) < numOfUniqueItems) {
					_schema.properties[key].enum = uniqueItems;
				}
			} else if (['object'].includes(mostOccuredType!)) {
				_schema.properties[key] = {
					..._schema.properties[key],
					type: 'object',
					...deriveJSONSchema(array[0][key], {
						properties: {}
					})
				};
			} else {
				_schema.properties[key] = { type: mostOccuredType };
			}
		}
	}
	console.log({ _schema });
	return _schema;
};

export const removeFileExtension = (fileName: string): string => {
	if (typeof fileName !== 'string') {
		return '';
	}

	const lastDotIndex = fileName.lastIndexOf('.');

	if (lastDotIndex === -1 || lastDotIndex === 0) {
		// No extension found or dot at the beginning (hidden file).
		return fileName;
	}

	return fileName.substring(0, lastDotIndex);
};

export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
	const result = {} as Pick<T, K>;
	keys.forEach((key) => {
		if (key in obj) {
			result[key] = obj[key];
		}
	});
	return result;
};

/**
 * Defines the structure for a segment of a string, indicating if it's
 * whitespace or regular content.
 */
type StringPart = {
	isWhiteSpace: boolean;
	content: string;
};

/**
 * Extracts leading and trailing whitespace from a string and segments it.
 * The output is an array of objects, preserving the original order:
 * [leading_whitespace?, core_content?, trailing_whitespace?].
 *
 * Parts are only included in the array if they have content.
 *
 * @param input The string to process.
 * @returns An array of StringPart objects.
 */
export const extractWhitespaceParts = (input: string): StringPart[] => {
	// 1. Handle null, undefined, or empty string inputs gracefully.
	if (!input || typeof input !== 'string') {
		return [];
	}

	// 2. Use a regular expression to capture the three main parts:
	//    - Group 1: (^\\s*) - Leading whitespace (0 or more chars).
	//    - Group 2: ([\\s\\S]*?) - The "middle" content. `[\s\S]` matches any character
	//                              including newlines, and `*?` makes it non-greedy.
	//    - Group 3: (\\s*$) - Trailing whitespace (0 or more chars).
	const match = input.match(/^(\s*)([\s\S]*?)(\s*)$/);

	// This regex will always match, so we can safely assume `match` is not null.
	// We use a non-null assertion `!` for type safety clarity.
	const [, leading = '', middle = '', trailing = ''] = match!;

	// The middle part from the regex might still have whitespace if the trailing
	// part was empty. We trim it to get the true core content.
	const coreContent = middle.trim();

	const result: StringPart[] = [];

	// 3. Handle the special case where the string is ONLY whitespace.
	if (input.length > 0 && coreContent.length === 0) {
		return [{ isWhiteSpace: true, content: input }];
	}

	// 4. Build the result array, adding parts only if they exist.

	// Add the leading whitespace part if it has content
	if (leading) {
		result.push({ isWhiteSpace: true, content: leading });
	}

	// Add the core content part if it has content
	if (coreContent) {
		result.push({ isWhiteSpace: false, content: coreContent });
	}

	// Add the trailing whitespace part if it has content
	if (trailing) {
		result.push({ isWhiteSpace: true, content: trailing });
	}

	return result;
};

/**
 * Checks if array `a` contains any of the values from array `b`.
 * This approach is very readable and suitable for most cases.
 *
 * @param a The array to check within.
 * @param b The array of values to search for.
 * @returns `true` if any value from `b` is found in `a`, otherwise `false`.
 */
export const includesAny = (a: string[], b: string[]): boolean => {
	// Use .some() to check if at least one element in `b`
	// passes the test. The test is whether `a` includes that element.
	return b.some((value) => a.includes(value));
};

/**
 * Checks if array `a` contains any of the values from array `b` using a Set.
 * This is the most performant approach for large arrays.
 *
 * @param a The array to check within.
 * @param b The array of values to search for.
 * @returns `true` if any value from `b` is found in `a`, otherwise `false`.
 */
export const includesAnyOptimized = (a: string[], b: string[]): boolean => {
	// Create a Set from the first array for fast lookups.
	const setA = new Set(a);

	// Check if any element in the second array exists in the Set.
	return b.some((value) => setA.has(value));
};

export const getLabelFor = (jsonPaths: string[], prefix = 'document-editor') => {
	return prefix + jsonPaths.join('-');
};

/**
 * Recursively checks if any nested property in a JSON Schema object has the types.
 *
 * @param {JSONSchema} schema - The JSON Schema object to inspect.
 * @returns {boolean} - True if a property with types is found, otherwise false.
 */
export function hasXTypes(schema: JSONSchema7WithUnknown, types = ['unknown']): boolean {
	// Base case: Check if the current object itself has types e.g. "unknown".
	if (types.includes(schema.type)) {
		return true;
	}

	// Recursive step 1: Check nested properties of an object.
	if (schema.properties) {
		// We use `Object.values` and the `.some()` method for an early exit.
		// If any of the recursive calls return true, `.some()` will stop and return true.
		const hasUnknownInProperties = Object.values(schema.properties).some((propertySchema) =>
			hasXTypes(propertySchema as JSONSchema7WithUnknown)
		);
		if (hasUnknownInProperties) {
			return true;
		}
	}

	// Recursive step 2: Check the 'items' of an array.
	if (schema.items) {
		// The 'items' property can be a single schema object or an array of them.
		if (Array.isArray(schema.items)) {
			// If it's an array of schemas, check each one.
			const hasUnknownInItemsArray = schema.items.some((itemSchema) =>
				hasXTypes(itemSchema as JSONSchema7WithUnknown)
			);
			if (hasUnknownInItemsArray) {
				return true;
			}
		} else if (typeof schema.items === 'object') {
			// If it's a single schema object.
			if (hasXTypes(schema.items as JSONSchema7WithUnknown)) {
				return true;
			}
		}
	}

	// If we've searched all branches and found nothing, return false.
	return false;
}

/**
 * Get value of object's nested fields
 */
export const getValueByJsonPaths = <T = any>(
	object: any,
	jsonPaths: (string | number)[] = []
): T | undefined => {
	let value = object;
	if (jsonPaths.length === 1 && jsonPaths[0] === '') {
		return value;
	}
	for (const field of jsonPaths) {
		value = value?.[field];
	}
	return value;
};

/**
 * Sets a value at a specified jsonPaths within an object.
 * This function MUTATES the original object.
 *
 * @param {any} obj The object or array to modify.
 * @param {(string | number)[]} jsonPaths The jsonPaths to the property to set.
 * @param
 * @returns {any} The modified object.
 */
export function setValueByJsonPathsMutable(
	obj: any,
	jsonPaths: (string | number)[],
	options: {
		value?: any;
		isGetNestedFieldOnly?: boolean;
		isArray?: boolean;
	}
): any {
	if (!obj || typeof obj !== 'object' || jsonPaths.length === 0) {
		return obj; // Cannot mutate a non-object or if jsonPaths is empty
	}

	let current: any = obj;

	// Iterate through the jsonPaths up to the second-to-last key.
	for (let i = 0; i < jsonPaths.length - 1; i++) {
		const key = jsonPaths[i];

		// If the next level in the jsonPaths does not exist or is not an object, create it.
		if (current[key] === null || typeof current[key] !== 'object') {
			const nextKey = jsonPaths[i + 1];
			// Create an array if the next key is a number, otherwise create an object.
			current[key] = typeof nextKey === 'number' ? [] : {};
		}
		// Move to the next level.
		current = current[key];
	}

	// Set the value on the final key.
	const lastKey = jsonPaths[jsonPaths.length - 1];
	if (options.isGetNestedFieldOnly) {
		if (options.isArray && !current[lastKey]) {
			current[lastKey] = [];
		}
		return current[lastKey];
	} else {
		current[lastKey] = options.value;
		return obj; // Return the mutated object.
	}
}
