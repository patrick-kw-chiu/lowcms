<!--
	@component RelationshipEditor
-->
<script lang="ts">
	import { getContext } from 'svelte';
	// Types
	import type { Content, JSONSchema7WithCustomKeyword, Schema } from '$lib/types/types.svelte';
	// Utilities
	// Constants and locales
	import RemovableSelect from '$lib/components/app/removable-select/removable-select.svelte';
	import { checkHasIDField } from '$lib/utilities/utilities.svelte';
	import type { Selected } from 'bits-ui';

	interface Props {
		type: 'x_relationship_one_to_one' | 'x_relationship_one_to_many';
		keywordObj: JSONSchema7WithCustomKeyword;
		disabled?: boolean;
	}
	let { type, keywordObj = $bindable(), disabled }: Props = $props();

	const data = (getContext('data') ?? { schemas: [], contents: [] }) as {
		schemas: Schema[];
		contents: Content[];
	};
	const schemasWidthIDField = $derived(
		data.schemas.filter((s: any) => checkHasIDField(s))
	) as Schema[];
	const schemaIdsWithIDField = $derived(schemasWidthIDField.map((s: any) => s.id));
	const contentsWithIDField = $derived(
		data.contents.filter((c: any) => schemaIdsWithIDField.includes(c.schemaId))
	) as Content[];

	const xContentId = $derived(keywordObj['x-content-id']);
	const xIdField = $derived(keywordObj['x-id-field']);
	const selectedContent = $derived(contentsWithIDField.find((c) => c.id === xContentId));
	const selectedSchema = $derived(
		schemasWidthIDField.find((s: Schema) => s.id === selectedContent?.schemaId)
	);

	const idFields = $derived(
		selectedSchema?.properties
			? Object.entries(selectedSchema.properties).filter((p: any) =>
					['x_id_uuid', 'x_id_nanoid'].includes(p[1].type)
				)
			: []
	);

	console.log({ data, schemasWidthIDField, contentsWithIDField, idFields });
</script>

<p class="text-xs opacity-60">
	<!-- TODO locales -->
	Select a content and the ID field that you want to link
	{#if ['x_relationship_one_to_one'].includes(type)}
		a document to.
	{:else if ['x_relationship_one_to_many'].includes(type)}
		multiple documents to.
	{/if}
</p>

{#if contentsWithIDField.length > 0}
	<!-- TODO locales -->
	<RemovableSelect
		label="Content"
		value={xContentId}
		options={contentsWithIDField.map((c) => ({
			label: c.name,
			value: c.id
		}))}
		onSelectedChange={(item) => {
			const { value } = item as Selected<string>;
			keywordObj['x-content-id'] = value;
		}}
		{disabled}
		onRemove={() => {
			console.log({ keywordObj });
			delete keywordObj['x-content-id'];
			delete keywordObj['x-id-field'];
		}}
	/>
	{#if idFields.length > 0}
		<!-- TODO locales -->
		<RemovableSelect
			label="Field"
			value={xIdField}
			options={idFields.map((idField) => ({
				label: idField[0],
				value: idField[0]
			}))}
			onSelectedChange={(item) => {
				const { value } = item as Selected<string>;
				keywordObj['x-id-field'] = value;
			}}
			{disabled}
			onRemove={() => {
				console.log({ keywordObj });
				delete keywordObj['x-id-field'];
			}}
		/>
	{/if}
{:else}
	<p class="text-xs text-red-500">No contents with ID field found. Please create a</p>
{/if}
