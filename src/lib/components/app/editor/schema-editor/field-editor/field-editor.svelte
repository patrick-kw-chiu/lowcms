<script lang="ts">
	// Libraries - shadcn
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	// Libraries - lucide
	// Types
	import type { JSONSchema7WithCustomKeyword } from '$lib/types/types.svelte';
	import type { Selected } from 'bits-ui';
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';
	// Constants and locales
	import { FIELD } from '$lib/constants/constants.svelte';
	import * as m from '$lib/paraglide/messages.js';
	// Components
	import Hr from '$lib/components/app/hr.svelte';
	import FieldTypeSelect from '$lib/components/app/select/field-type-select/field-type-select.svelte';
	import KeywordMapEditor from './keyword-map-editor/keyword-map-editor.svelte';

	interface Props {
		/**
		 * Support both add and edit field.
		 * @param field
		 * @param schema
		 */
		onConfirmFieldDetail: (field: string, schema: JSONSchema7) => void;
		field?: string;
		jsonSchema?: JSONSchema7;
		keywordObj?: JSONSchema7WithCustomKeyword;
		disabled: boolean;
	}
	let { onConfirmFieldDetail, field, jsonSchema, keywordObj, disabled }: Props = $props();

	let _field = $state(field);
	let _fieldType = $state<JSONSchema7TypeName | undefined>(jsonSchema?.type as JSONSchema7TypeName);
	let _keywordObj = $state<JSONSchema7WithCustomKeyword | undefined>(keywordObj);

	const reset = () => {
		_field = '';
		_fieldType = undefined;
		_keywordObj = {};
	};

	const formulateSchema = (fieldDataType: JSONSchema7TypeName) => {
		let schema: JSONSchema7 = { type: fieldDataType };
		if (!['object'].includes(fieldDataType)) {
			schema = { ...schema, ..._keywordObj };
		} else if (fieldDataType === 'object') {
			schema.properties = {};
		}
		return schema;
	};

	// TODO: Should use two-way binding, but library's type seems incorrect
	const handleDataTypeChange = (item: unknown) => {
		const { value } = item as Selected<JSONSchema7TypeName>;
		_fieldType = value;
		_keywordObj = FIELD[value].keywords.reduce(
			(prev, curr) => ({ ...prev, [curr]: undefined }),
			{}
		);

		console.log($state.snapshot(_keywordObj));
	};
</script>

<div class="relative grid w-full gap-2">
	<div class="space-y-2">
		<Label for="field">{cap(m.field())} name *</Label>
		<Input id="field" bind:value={_field} required {disabled} />
	</div>
	<FieldTypeSelect bind:fieldType={_fieldType} {disabled} {handleDataTypeChange} />
	<Hr class="mb-0" />
	{#if _keywordObj}
		<KeywordMapEditor bind:keywordObj={_keywordObj} type={_fieldType!} {disabled} />
	{/if}
	{#if !disabled}
		<Button
			size="sm"
			onclick={() => {
				console.log({ _fieldType });
				if (!_field || !_fieldType) {
					// TODO locales
					return toast.warning('Please field in the field name and select the data type.', {
						position: 'top-center'
					});
				}
				if (!new RegExp('^[^.]*$').test(_field)) {
					// TODO locales
					return toast.warning('Field name can\'t contain dot "."', {
						position: 'top-center'
					});
				}

				if (_fieldType.startsWith('x_relationship_')) {
					if (_keywordObj?.['x-content-id'] === undefined) {
						// TODO locales
						return toast.warning('Please select a content to link.', {
							position: 'top-center'
						});
					}
					if (_keywordObj?.['x-id-field'] === undefined) {
						// TODO locales
						return toast.warning('Please select an ID field.', {
							position: 'top-center'
						});
					}
				}

				onConfirmFieldDetail(_field, formulateSchema(_fieldType));
				reset();
			}}
		>
			{cap(m.save_changes())}
		</Button>
	{/if}
</div>
