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
