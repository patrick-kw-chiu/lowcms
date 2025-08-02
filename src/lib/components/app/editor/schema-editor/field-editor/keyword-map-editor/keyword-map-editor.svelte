<script lang="ts">
	// Libraries - shadcn
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';

	// Libraries - lucide
	import X from 'lucide-svelte/icons/x';

	// Types
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	import type { JSONObject, JSONSchema7WithCustomKeyword } from '$lib/types/types.svelte';

	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';
	import { FIELD } from '$lib/constants/constants.svelte';
	import type { Selected } from 'bits-ui';
	import EnumEditor from './enum-editor.svelte';
	import RemovableSelect from '$lib/components/app/removable-select/removable-select.svelte';
	import StringCustomTypeEditor from './string-custom-type-editor.svelte';

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
		<StringCustomTypeEditor bind:keywordObj {disabled} />
		<div class={keywordObj['x-string-custom-type'] ? 'opacity-60' : ''}>
			<EnumEditor
				bind:keywordObj
				type="string"
				disabled={disabled || !!keywordObj['x-string-custom-type']}
			/>
		</div>
	{/if}
	<!-- {#each entries as entry}
		<div class="space-y-2">
			<Label for="field">{entry[0]}</Label>
			<Input id="field" placeholder="Coming soon!" disabled />
		</div>
	{/each} -->
{/if}
