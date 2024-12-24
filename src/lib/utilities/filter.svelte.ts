import escapeStringRegexp from 'escape-string-regexp';

import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
import type { Page } from '@sveltejs/kit';

import { availableLanguageTags } from '$lib/paraglide/runtime.js';
import * as m from '$lib/paraglide/messages';

import type {
	DirectoryWithInfo,
	FilterObject,
	JSONObject,
	LowCMSType,
	RootOpKey,
	Section
} from '$lib/types/types.svelte';

import {
	BASE_PATH,
	BASE_SCHEMA,
	JSON_SCHEMA,
	TYPE_TO_JSON_TYPE_MAP
} from '$lib/constants/constants.svelte';
import { getLowCMSTypeByConfig } from './utilities.svelte';

export const updateFilterObject = (
	filterObject: FilterObject,
	field: string,
	config: JSONSchema7,
	op: any
) => {
	console.log({
		filterObject: $state.snapshot(filterObject),
		field,
		config: $state.snapshot(config),
		op
	});

	let rootOpKey = filterObject.$and ? '$and' : filterObject.$or ? '$or' : undefined;

	// Assign default filter
	if (!rootOpKey) {
		filterObject.$and = [];
		rootOpKey = '$and';
	}

	let indexOfField = filterObject[rootOpKey! as RootOpKey].findIndex((filter: any) => {
		const fieldOps = filter.$or ?? filter.$and;
		return fieldOps.some((op: any) => Object.keys(op)[0] === field);
	});

	if (indexOfField === -1) {
		filterObject[rootOpKey! as RootOpKey].push({
			$or: []
		});
		indexOfField = filterObject[rootOpKey! as RootOpKey].length - 1;
	}

	const fieldOps = filterObject[rootOpKey! as RootOpKey][indexOfField].$or;
	const opType = Object.keys(op)[0];
	const opValue = op[opType];
	const indexOfFieldOp = fieldOps.findIndex((op: any) => Object.keys(op[field])[0] === opType);

	const isArrayOfStrings = getLowCMSTypeByConfig(config) === 'array-of-strings';

	// $exists
	if (opType === '$exists') {
		if (indexOfFieldOp === -1) {
			fieldOps.push({ [field]: op });
		} else {
			fieldOps[indexOfFieldOp] = { [field]: op };
		}
	}

	console.log(3, {
		filterObject: $state.snapshot(filterObject),
		fieldOps: $state.snapshot(fieldOps),
		opType,
		opValue,
		indexOfField,
		indexOfFieldOp
	});

	// $eq, $ne, $regex - string
	if (config.type === 'string' && ['$eq', '$ne', '$regex'].includes(opType)) {
		const _op =
			opType === '$regex'
				? {
						$regex: new RegExp(`.*${escapeStringRegexp(opValue)}.*`, 'i'),
						____rawRegexValue____: opValue
					}
				: op;
		if (indexOfFieldOp === -1) {
			fieldOps.push({ [field]: _op });
		} else {
			fieldOps[indexOfFieldOp] = { [field]: _op };
		}
	}

	// $in
	if ((config.type === 'string' || isArrayOfStrings) && opType === '$in') {
		if (opValue === 'all') {
			fieldOps.splice(indexOfFieldOp, 1);
		} else {
			if (indexOfFieldOp === -1) {
				fieldOps.push({ [field]: op });
			} else {
				fieldOps[indexOfFieldOp] = { [field]: op };
			}
		}
	}

	// $eq, $ne, $gt, $gte, $lt, $lte - number
	if (
		(config.type === 'number' || config.type === 'integer') &&
		['$eq', '$ne', '$gt', '$gte', '$lt', '$lte'].includes(opType)
	) {
		if (indexOfFieldOp === -1) {
			fieldOps.push({ [field]: op });
		} else {
			fieldOps[indexOfFieldOp] = { [field]: op };
		}
	}

	// $eq - boolean
	if (config.type === 'boolean' && opType === '$eq') {
		if (opValue === undefined) {
			fieldOps.splice(indexOfFieldOp, 1);
		} else if (indexOfFieldOp === -1) {
			fieldOps.push({ [field]: op });
		} else {
			fieldOps[indexOfFieldOp] = { [field]: op };
		}
	}

	if (fieldOps.length === 0) {
		delete filterObject[rootOpKey! as RootOpKey][indexOfField];
	}
	if (filterObject[rootOpKey! as RootOpKey]?.length === 0) {
		delete filterObject[rootOpKey! as RootOpKey];
	}
	if (filterObject.$or?.length === 0) {
		delete filterObject.$or;
	}
	if (filterObject.$and?.length === 0) {
		delete filterObject.$and;
	}
};

interface SearchResult {
	fieldIndex: number;
	fieldValues: any[];
	opIndex?: number;
	opValue?: any;
}

/**
 * Finds information about a specific field and operator within a nested Mongo query.
 * The expected query structure is { $and: [ { $or: [ ... ] } ] }.
 *
 * @param query The MongoDB query object.
 * @param fieldOfInterest The name of the field to search for (e.g., "name").
 * @param operatorOfInterest The name of the operator to search for without the '$' (e.g., "eq").
 * @returns An object with the fieldIndex, opIndex, and opValue if found, otherwise null.
 */
export function findFieldInfoInQuery(
	query: FilterObject,
	fieldOfInterest: string,
	operatorOfInterest: string
): SearchResult | null {
	const fieldOps = query.$and ?? query.$or ?? [];

	const targetOperator = `$${operatorOfInterest}`;

	// 1. Iterate through the top-level '$and' array to find the field block.
	for (let fieldIndex = 0; fieldIndex < fieldOps.length; fieldIndex++) {
		const andClause = fieldOps[fieldIndex];

		if (!andClause?.$or || andClause.$or.length === 0) {
			continue;
		}

		const orConditions = andClause.$or;
		const fieldNameOfClause = Object.keys(orConditions[0])[0];

		// 2. Check if the field of this block matches our target.
		if (fieldNameOfClause === fieldOfInterest) {
			// We have found the correct field block at `fieldIndex`.
			// Now, we must search for the operator within this block.

			for (let opIndex = 0; opIndex < orConditions.length; opIndex++) {
				const condition = orConditions[opIndex];
				// The operator object is the value associated with the field name
				const operatorObject = condition[fieldNameOfClause];
				const currentOperator = Object.keys(operatorObject)[0];

				if (currentOperator === targetOperator) {
					// Found everything! Return the full result and exit the function.
					return {
						fieldIndex: fieldIndex,
						fieldValues: orConditions,
						opIndex: opIndex,
						opValue: operatorObject[currentOperator]
					};
				}
			}

			// If the inner loop finished without finding the operator, the operator
			// does not exist in this field's block. As per the requirement, we
			// return the partial result containing only the fieldIndex.
			return { fieldIndex: fieldIndex, fieldValues: orConditions };
		}
	}

	// If the outer loop completes, the field of interest was never found.
	return null;
}

// https://www.mongodb.com/docs/manual/reference/operator/query/

/**
 * A helper type to extract the element type from an array type.
 * If T is not an array, it resolves to T.
 * e.g., ArrayElement<string[]> -> string
 * e.g., ArrayElement<number> -> number
 */
type ArrayElement<A> = A extends readonly (infer T)[] ? T : A;

// Primitive values that can be used for comparison.
type ComparisonValue = string | number | boolean | null;

// Field-level comparison operators. Now uses ArrayElement for array-aware typing.
type FieldComparisonOperators<TField> = {
	$eq?: TField;
	$ne?: TField;
	$in?: TField[];
	$nin?: TField[];
	$gt?: TField extends ComparisonValue ? TField : never;
	$gte?: TField extends ComparisonValue ? TField : never;
	$lt?: TField extends ComparisonValue ? TField : never;
	$lte?: TField extends ComparisonValue ? TField : never;
	// New operator: $all requires all elements to be present in an array field.
	$all?: ArrayElement<TField>[];
};

// A condition for a single field.
type FieldCondition<T> = T | FieldComparisonOperators<T>;

// The core recursive filter type remains the same structurally.
export type MongoFilter<T> = {
	$and?: MongoFilter<T>[];
	$or?: MongoFilter<T>[];
} & {
	[K in keyof T]?: FieldCondition<T[K]>;
};

/**
 * Evaluates a single field's condition against an item's opValue.
 * This version is enhanced to support array fields.
 *
 * @param itemValue The actual opValue from the data object (e.g., user.age or user.tags).
 * @param condition The condition from the filter (e.g., { $gt: 25 } or 'js' or { $all: ['ts'] }).
 * @returns True if the condition is met, false otherwise.
 */
// function evaluateFieldCondition(itemValue: any, condition: any): boolean {
// 	// Case 1: The condition is a primitive opValue (e.g., { tags: 'js' }).
// 	if (typeof condition !== 'object' || condition === null) {
// 		// If the item's field is an array, this is an implicit "contains" check.
// 		if (Array.isArray(itemValue)) {
// 			return itemValue.includes(condition);
// 		}
// 		// Otherwise, it's a direct equality check.
// 		return itemValue === condition;
// 	}

// 	// Case 2: The condition is an object with operators (e.g., { $gt: 10, $all: [...] }).
// 	// Every operator in the object must be true for the condition to match.
// 	return Object.entries(condition).every(([operator, operand]) => {
// 		switch (operator) {
// 			case '$eq':
// 				return itemValue === operand;
// 			case '$ne':
// 				return itemValue !== operand;
// 			case '$gt':
// 				return itemValue > (operand as number);
// 			case '$gte':
// 				return itemValue >= (operand as number);
// 			case '$lt':
// 				return itemValue < (operand as number);
// 			case '$lte':
// 				return itemValue <= (operand as number);
// 			case '$in':
// 				// If item field is an array, check if any of its elements are in the operand array.
// 				if (Array.isArray(itemValue)) {
// 					return Array.isArray(operand) && itemValue.some((val) => operand.includes(val));
// 				}
// 				// Original behavior for non-array fields.
// 				return Array.isArray(operand) && operand.includes(itemValue);
// 			case '$nin':
// 				// If item field is an array, check that none of its elements are in the operand array.
// 				if (Array.isArray(itemValue)) {
// 					return Array.isArray(operand) && !itemValue.some((val) => operand.includes(val));
// 				}
// 				// Original behavior for non-array fields.
// 				return Array.isArray(operand) && !operand.includes(itemValue);

// 			// New operator for arrays
// 			case '$all':
// 				// Requires the item's field to be an array and include ALL elements from the operand.
// 				if (!Array.isArray(itemValue) || !Array.isArray(operand)) {
// 					return false;
// 				}
// 				return (operand as any[]).every((elem) => itemValue.includes(elem));

// 			default:
// 				// Ignoring unknown operators is a safe default.
// 				return true;
// 		}
// 	});
// }

/**
 * Recursively evaluates a filter object against a single data item.
 * @param item The data object to check.
 * @param filter The filter to apply.
 * @returns True if the item matches the filter, false otherwise.
 */
// function evaluateFilter<T extends Record<string, any>>(item: T, filter: MongoFilter<T>): boolean {
// 	return (Object.keys(filter) as (keyof MongoFilter<T>)[]).every((key) => {
// 		if (key === '$and') {
// 			return filter.$and!.every((subFilter) => evaluateFilter(item, subFilter));
// 		}
// 		if (key === '$or') {
// 			if (!filter.$or || filter.$or.length === 0) return false;
// 			return filter.$or!.some((subFilter) => evaluateFilter(item, subFilter));
// 		}
// 		const fieldCondition = filter[key as keyof T];
// 		const itemValue = item[key as keyof T];
// 		return evaluateFieldCondition(itemValue, fieldCondition);
// 	});
// }

/**
 * Filters an array of objects based on a MongoDB-like filter object,
 * supporting nested $and/$or and field comparison operators.
 *
 * @param data The raw array of objects to search through.
 * @param filter The filter object.
 * @returns A new array containing only the items that match the filter.
 */
// export function mongoSearch<T extends Record<string, any>>(data: T[], filter: MongoFilter<T>): T[] {
// 	if (!filter || Object.keys(filter).length === 0) {
// 		return data;
// 	}
// 	return data.filter((item) => evaluateFilter(item, filter));
// }
