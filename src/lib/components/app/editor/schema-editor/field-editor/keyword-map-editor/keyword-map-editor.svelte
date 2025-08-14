<script lang="ts">
	import { nanoid } from 'nanoid';
	import { v4 as uuidv4 } from 'uuid';
	// Libraries - shadcn
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	// Libraries - lucide
	// Types
	import type { JSONSchema7WithCustomKeyword } from '$lib/types/types.svelte';
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import { FIELD } from '$lib/constants/constants.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { Selected } from 'bits-ui';
	import EnumEditor from './enum-editor.svelte';
	import RelationshipEditor from './relationship-editor.svelte';

	interface Props {
		keywordObj: JSONSchema7WithCustomKeyword;
		type: JSONSchema7TypeName;
		disabled: boolean;
	}
	let { keywordObj = $bindable(), type, disabled }: Props = $props();

	// TODO: Should use two-way binding, but library's type seems incorrect
	const handleArrayOfChange = (item: unknown) => {
		const { value } = item as Selected<JSONSchema7TypeName>;
		keywordObj = {
			...keywordObj,
			items: {
				type: value,
				properties: value === 'object' ? {} : undefined,
				enum: value === 'string' ? [] : undefined
			}
		};
	};
</script>

{#if type === 'array'}
	<Label for="array-of">{m.x_of_y({ x: '...', y: m.array() })}</Label>
	<Select.Root
		portal={null}
		selected={{ value: (keywordObj?.items as JSONSchema7)?.type }}
		onSelectedChange={handleArrayOfChange}
		{disabled}
	>
		<Select.Trigger id="array-of">
			<!-- TODO: workaround to show selected value -->
			{#if (keywordObj?.items as JSONSchema7)?.type}
				{(keywordObj?.items as JSONSchema7)?.type}
			{:else}
				<Select.Value placeholder={m.x_of_y({ x: '...', y: m.array() })} />
			{/if}
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				{#each FIELD.types.filter((t) => t === 'string' || t === 'object') as jsonSchemaType}
					<Select.Item value={jsonSchemaType} label={cap(m[jsonSchemaType]())}>
						<span class={`h-3.5 w-3.5 lc-badge-${jsonSchemaType}`}></span>
						{cap(m[jsonSchemaType]())}
					</Select.Item>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>
	{#if (keywordObj?.items as JSONSchema7)?.type === 'string'}
		<EnumEditor bind:keywordObj type="array-of-strings" {disabled} />
	{/if}
{:else}
	{#if type === 'string'}
		<EnumEditor bind:keywordObj type="string" {disabled} />
	{/if}
	{#if ['x_id_uuid', 'x_id_nanoid'].includes(type)}
		<p class="text-xs opacity-60">
			<!-- TODO locales -->
			{#if ['x_id_uuid'].includes(type)}
				You can generate a UUID in LowCMS e.g. "{uuidv4()}", or input your own.
			{:else if ['x_id_nanoid'].includes(type)}
				You can generate a nanoid in LowCMS e.g. "{nanoid(32)}", or input your own.
			{/if}
		</p>
	{/if}
	{#if ['x_relationship_one_to_one', 'x_relationship_one_to_many'].includes(type)}
		<RelationshipEditor
			bind:keywordObj
			type={type as 'x_relationship_one_to_one' | 'x_relationship_one_to_many'}
			{disabled}
		/>
	{/if}
	<!-- {#each entries as entry}
		<div class="space-y-2">
			<Label for="field">{entry[0]}</Label>
			<Input id="field" placeholder="Coming soon!" disabled />
		</div>
	{/each} -->
{/if}
