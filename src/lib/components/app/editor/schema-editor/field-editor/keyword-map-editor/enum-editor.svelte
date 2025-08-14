<!--
@component

`EnumEditor` add/remove `enums` for a schema field (`string` or `array of strings`)
-->
<script lang="ts">
	import { innerHeight } from 'svelte/reactivity/window';
	// Libraries - shadcn
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	// Libraries - lucide
	import X from 'lucide-svelte/icons/x';
	// Types
	import type { JSONSchema7 } from 'json-schema';
	// Utilities
	import { extractWhitespaceParts } from '$lib/utilities/utilities.svelte';
	// Constants and locales
	import {} from '$lib/constants/constants.svelte';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		type: 'array-of-strings' | 'string';
		keywordObj: JSONSchema7;
		disabled: boolean;
		onUpdateEnumFilter?: (enums: string[] | 'all') => void;
	}
	let { type, keywordObj = $bindable(), disabled }: Props = $props();
	let enumValue = $state('');

	// Filter mode
	console.log({ keywordObj });

	const addEnumValue = () => {
		if (type === 'string') {
			keywordObj = {
				...keywordObj,
				enum: [...new Set([...(keywordObj?.enum ?? []), enumValue])]
			};
		} else {
			keywordObj = {
				...keywordObj,
				items: {
					...(keywordObj.items as JSONSchema7),
					enum: [...new Set([...((keywordObj?.items as JSONSchema7)?.enum ?? []), enumValue])]
				}
			};
		}
		enumValue = '';
	};

	const removeEnumValue = (enumValue: string) => {
		console.log({ keywordObj });
		if (type === 'string') {
			keywordObj = {
				...keywordObj,
				enum: (keywordObj?.enum ?? []).filter((e) => e !== enumValue)
			};
		} else {
			keywordObj = {
				...keywordObj,
				items: {
					...(keywordObj.items as JSONSchema7),
					enum: (keywordObj.items as JSONSchema7).enum!.filter((e) => e !== enumValue)
				}
			};
		}
	};
</script>

{#snippet EditEnumBadge(
	enumValue: string,
	removeEnumValue: (enumValue: string) => void,
	disabled: boolean
)}
	<Badge class="mb-1 mr-1">
		{#each extractWhitespaceParts(enumValue) as part}
			<span style={part.isWhiteSpace ? 'text-decoration: wavy underline;' : ''}>
				{part.content}
			</span>
		{/each}
		{#if !disabled}
			<X
				class="h-4 w-4 cursor-pointer"
				style="transform: translateX(0.125rem)"
				onclick={() => removeEnumValue(enumValue)}
			/>
		{/if}
	</Badge>
{/snippet}

<div class="w-full">
	<div class="space-y-2">
		<Label for="enum-value">{m.enumeration()}</Label>
		<div class="flex w-full max-w-sm items-center space-x-2">
			<Input id="enum-value" bind:value={enumValue} {disabled} />
			<Button type="submit" disabled={!enumValue} onclick={addEnumValue}>{m.add()}</Button>
		</div>
	</div>
	<div
		style={`max-height: ${Math.max((innerHeight.current ?? 200) / 4, 200)}px; max-width: $200}px; overflow-y: auto;`}
	>
		{#if (keywordObj.enum ?? []).length > 0}
			{#each keywordObj.enum! as enumValue}
				{@render EditEnumBadge(enumValue as string, removeEnumValue, disabled)}
			{/each}
		{:else if ((keywordObj?.items as JSONSchema7)?.enum ?? []).length > 0}
			{#each (keywordObj?.items as JSONSchema7)?.enum! as enumValue}
				{@render EditEnumBadge(enumValue as string, removeEnumValue, disabled)}
			{/each}
		{:else}
			<p class="text-xs opacity-60">{m.enum_description()}</p>
		{/if}
	</div>
</div>
