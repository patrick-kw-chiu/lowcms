<script lang="ts">
	// Libraries - shadcn
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';

	// Libraries - lucide
	import X from 'lucide-svelte/icons/x';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeClosed from 'lucide-svelte/icons/eye-closed';

	// Types
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	import type { FilterObject, JSONObject, StringOpType } from '$lib/types/types.svelte';
	import type { Selected } from 'bits-ui';

	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';
	import { OpTypeToLabelMap, StringFilterOperatorOptions } from '$lib/constants/constants.svelte';

	// Components
	import FilterObjectEditor from './filter-object-editor.svelte';

	interface Props {
		filterObject: FilterObject;
		nestedFilterObject?: FilterObject;
		isRoot?: boolean;
		lv1Index?: number;
		lv2Index?: number;
	}
	let {
		filterObject = $bindable(),
		nestedFilterObject,
		isRoot = false,
		lv1Index,
		lv2Index
	}: Props = $props();
	let [key, filters] = $derived(Object.entries(nestedFilterObject ?? filterObject)[0] ?? ['', []]);
</script>

{#snippet XIcon(type: 'and-or' | 'op' = 'and-or', lv1Index: number, lv2Index?: number)}
	<X
		class="h-4 w-4 cursor-pointer rounded-full p-0.5 hover:bg-sky-200/30"
		style={`transform: translateX(${type === 'and-or' ? 0.5 : 0}rem); min-width: 1rem;`}
		onclick={() => {
			const rootOpKey = filterObject['$and'] ? '$and' : '$or';
			const rootHasOnly1Field = filterObject[rootOpKey].length === 1;
			if (lv1Index === undefined) {
				// 1. Remove the entire root object
				delete filterObject[rootOpKey];
			} else if (lv2Index === undefined) {
				// 2. Remove one of the field(s)
				if (rootHasOnly1Field) {
					delete filterObject[rootOpKey];
				} else {
					filterObject[rootOpKey].splice(lv1Index, 1);
				}
			} else {
				// 3. Remove one of the operator(s) of a field
				const lv2Key = Object.keys(filterObject[rootOpKey][lv1Index])[0];
				const operatorsOfLv2 = filterObject[rootOpKey][lv1Index][lv2Key];
				if (operatorsOfLv2.length === 1) {
					if (rootHasOnly1Field) {
						delete filterObject[rootOpKey];
					} else {
						delete filterObject[rootOpKey][lv1Index];
					}
				} else {
					filterObject[rootOpKey][lv1Index][lv2Key].splice(lv2Index, 1);
				}
			}
		}}
	/>
{/snippet}

{#snippet AndOrBox(label: string, filters: any, isRoot: boolean = false, lv1Index: number)}
	<div class="relative flex w-full flex-col gap-2 text-sm">
		<div
			class="absolute flex w-fit items-center justify-between rounded-t-md border border-b-0 border-sky-200/30 bg-accent/70 px-3.5 py-0.5"
		>
			{label}
			{@render XIcon('and-or', lv1Index)}
		</div>
		<div
			class={`relative mb-2 rounded-md border border-sky-200/30 bg-accent/70 p-2 ${isRoot ? 'pb-0' : ''}`}
			style="margin-top: 1.5rem;"
		>
			{#each filters as filter, index}
				<FilterObjectEditor
					{filterObject}
					nestedFilterObject={filter}
					lv1Index={isRoot ? index : lv1Index}
					lv2Index={isRoot ? undefined : index}
				/>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet OpBox(
	label: string,
	[opType, opValue]: [string | undefined, any],
	lv1Index: number,
	lv2Index: number
)}
	<div class="mr-2 inline-block">
		<div
			class="flex w-fit items-center gap-1.5 rounded-lg border border-sky-200/30 bg-accent/70 px-2 py-1"
		>
			<div style="font-weight: bold;">{label}</div>
			<div class="opacity-70" style="font-style: italic">{OpTypeToLabelMap[opType!]}</div>
			<div style="text-decoration: dashed underline;">
				{opType === '$regex'
					? filters.____rawRegexValue____
					: Array.isArray(opValue)
						? opValue.join(', ')
						: opValue}
			</div>
			{@render XIcon('op', lv1Index, lv2Index)}
		</div>
	</div>
{/snippet}

{#if ['$and', '$or'].includes(key)}
	{@render AndOrBox(key, filters, isRoot, lv1Index!)}
{:else if Boolean(key)}
	{@render OpBox(key, Object.entries(filters ?? {})[0] as [string, any], lv1Index!, lv2Index!)}
{/if}
