<script lang="ts">
	// Libraries - shadcn
	import { Badge } from '$lib/components/ui/badge';

	// Libraries - lucide
	import CirclePlus from 'lucide-svelte/icons/circle-plus';

	// Types
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	import type { JSONObject } from '$lib/types/types.svelte';

	// Utilities
	import { cap, getLowCMSTypeByConfig } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';

	// Components
	import SchemaEditor from './schema-editor.svelte';
	import AddFieldButton from './add-field-button.svelte';
	import EditFieldButton from './edit-field-button.svelte';

	interface Props {
		jsonSchema: JSONObject | JSONObject[];
		isRoot?: boolean;
		isArrayOfObjects?: boolean;
		disabled: boolean;
	}
	let {
		jsonSchema = $bindable(),
		isRoot = false,
		isArrayOfObjects = false,
		disabled = false
	}: Props = $props();
	let entries = $derived(Object.entries(jsonSchema));

	const onAddField = (
		field: string,
		schema: JSONSchema7,
		options?: {
			beforeField?: string;
		}
	) => {
		if (!options?.beforeField) {
			jsonSchema = {
				...jsonSchema,
				[field]: schema
			};
			return;
		}

		const newJson: JSONObject = {};
		for (const _field in jsonSchema) {
			if (_field === options?.beforeField) {
				newJson[field] = schema;
			}
			newJson[_field] = (jsonSchema as JSONObject)[_field];
		}
		jsonSchema = newJson;
	};

	const onRemoveField = (field: string) => {
		console.log({ jsonSchema, field });
		delete (jsonSchema as JSONObject)[field];
		jsonSchema = jsonSchema;
	};

	const onEditField = (field: string, newField: string, schema: JSONSchema7) => {
		console.log({ field, newField, schema });
		const newJson: JSONObject = {};
		for (const _field in jsonSchema) {
			if (_field === field) {
				if (field !== newField) {
					delete (newJson as JSONObject)[field];
				}
				(newJson as JSONObject)[newField] = schema;
			} else {
				newJson[_field] = (jsonSchema as JSONObject)[_field];
			}
		}
		jsonSchema = newJson;
	};
</script>

{#if isRoot && disabled}<div
		class="absolute right-0 top-0 w-24 transform rounded-bl-lg rounded-tr-lg bg-blue-500 py-1 text-center font-semibold text-white opacity-80 shadow-md"
	>
		{cap(m.view_only())}
	</div>{/if}{'{'}{#if !disabled && entries.length === 0}
	{'   '}<AddFieldButton {onAddField} isEmpty={true} {isRoot} />{/if}
{#each entries as entry, index}
	<div class="relative py-0.5 pl-4">
		{#if !disabled}<AddFieldButton {onAddField} {entry} />{/if}<span
			>{entry[0] ? entry[0] : "''"}:</span
		>
		<EditFieldButton
			{onEditField}
			{onRemoveField}
			field={entry[0]}
			jsonSchema={entry[1]}
			{disabled}
		/>{#if entry[1].type === 'object'}
			<SchemaEditor bind:jsonSchema={entry[1].properties} {disabled} />
		{:else if getLowCMSTypeByConfig(entry[1]) === 'array-of-objects'}
			<SchemaEditor
				bind:jsonSchema={entry[1].items.properties}
				isArrayOfObjects={true}
				{disabled}
			/>
		{/if}
		{#if !disabled && entries.length === index + 1}
			<AddFieldButton {onAddField} />
		{/if}
	</div>
{/each}{isRoot || entries.length === 0 ? '}' : ' }'}{isArrayOfObjects ? '[]' : ''}
