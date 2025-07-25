<script lang="ts">
	// Libraries - shadcn
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';

	// Libraries - lucide
	import CirclePlus from 'lucide-svelte/icons/circle-plus';

	// Types
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	import type { Selected } from 'bits-ui';
	import type { JSONObject, StringKeyword } from '$lib/types/types.svelte';

	// Utilities
	import { cap, pick } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';
	import { JSON_SCHEMA } from '$lib/constants/constants.svelte';

	// Components
	import KeywordMapEditor from './keyword-map-editor/keyword-map-editor.svelte';
	import Hr from '$lib/components/app/hr.svelte';

	interface Props {
		/**
		 * Support both add and edit field.
		 * @param field
		 * @param schema
		 */
		onConfirmFieldDetail: (field: string, schema: JSONSchema7) => void;
		field?: string;
		jsonSchema?: JSONSchema7;
		keywordObj?: JSONObject;
		disabled: boolean;
	}
	let { onConfirmFieldDetail, field, jsonSchema, keywordObj, disabled }: Props = $props();

	let _field = $state(field);
	let _dataType = $state<JSONSchema7TypeName | undefined>(jsonSchema?.type as JSONSchema7TypeName);
	let _keywordObj = $state<JSONSchema7 | undefined>(keywordObj);

	const reset = () => {
		_field = '';
		_dataType = undefined;
		_keywordObj = {};
	};

	const formulateSchema = (fieldDataType: JSONSchema7TypeName) => {
		let schema: JSONSchema7 = { type: fieldDataType };
		if (['string', 'array'].includes(fieldDataType)) {
			schema = { ...schema, ..._keywordObj };
		} else if (fieldDataType === 'object') {
			schema.properties = {};
		}
		return schema;
	};

	// TODO: Should use two-way binding, but library's type seems incorrect
	const handleDataTypeChange = (item: unknown) => {
		const { value } = item as Selected<JSONSchema7TypeName>;
		_dataType = value;
		_keywordObj = JSON_SCHEMA[value].keywords.reduce(
			(prev, curr) => ({ ...prev, [curr]: undefined }),
			{}
		);

		console.log($state.snapshot(_keywordObj));
	};
</script>

<div class="relative grid w-full gap-2">
	<div class="space-y-2">
		<Label for="field">{cap(m.field())} *</Label>
		<Input id="field" bind:value={_field} required {disabled} />
	</div>
	<Select.Root
		portal={null}
		selected={{ value: _dataType }}
		onSelectedChange={handleDataTypeChange}
		required
		{disabled}
	>
		<Select.Trigger class="">
			<!-- TODO: workaround to show selected value -->
			{#if _dataType}
				{_dataType}
			{:else}
				<Select.Value placeholder={cap(m.data_type()) + ' *'} />
			{/if}
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				{#each JSON_SCHEMA.types.filter((t) => t !== 'null') as jsonSchemaType}
					<Select.Item value={jsonSchemaType} label={cap(m[jsonSchemaType]())}>
						<span class={`h-3.5 w-3.5 lc-badge-${jsonSchemaType} mr-2`}></span>
						{cap(m[jsonSchemaType]())}
					</Select.Item>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>
	<Hr class="mb-0" />
	{#if _keywordObj}
		<KeywordMapEditor bind:keywordObj={_keywordObj} type={_dataType!} {disabled} />
	{/if}
	<!-- {#if _dataType === 'string'}
		<Hr class="mb-0" />
		<KeywordMapEditor bind:keywordObj={_keywordObj as StringKeyword} />
	{/if} -->
	{#if !disabled}
		<Button
			size="sm"
			onclick={() => {
				if (!_field || !_dataType) {
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
				onConfirmFieldDetail(_field, formulateSchema(_dataType));
				reset();
			}}
		>
			{cap(m.save_changes())}
		</Button>
	{/if}
</div>
