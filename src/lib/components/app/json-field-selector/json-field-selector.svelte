<script lang="ts">
	import { mode } from 'mode-watcher';

	import { Badge } from '$lib/components/ui/badge';

	import Braces from 'lucide-svelte/icons/braces';

	import type { JSONObject } from '$lib/types/types.svelte';

	import {
		checkIsJsonObject,
		checkIsSelectableField,
		getJSONSchemaTypeByValue,
		getLowCMSTypeByValue
	} from '$lib/utilities/utilities.svelte';

	import JsonFieldSelector from './json-field-selector.svelte';

	interface Props {
		json: JSONObject | JSONObject[];
		disabled: boolean;
		onselect?: (paths: string[]) => void;
		baseJsonPath?: string[];
		isExpanded?: boolean;
	}
	let { json, disabled = false, onselect, baseJsonPath = [], isExpanded = true }: Props = $props();
	let entries = $derived(Object.entries(json));
	let isArray = $derived(['array', 'array-of-objects'].includes(getLowCMSTypeByValue(json)));
	console.log({ entries });
</script>

{isArray ? '[' : '{'}
{#each entries as entry}
	<div class="whitespace-break-spaces py-0.5 pl-4">
		{#if !isArray}
			<button
				class={(disabled || !checkIsSelectableField(entry[1]) ? '' : 'lc-blink-background') +
					' rounded-sm px-1'}
				disabled={!onselect || disabled || !checkIsSelectableField(entry[1])}
				onclick={() => {
					onselect?.([...baseJsonPath, entry[0]]);
				}}
			>
				{entry[0] ? entry[0] : "''"}
			</button>:
		{/if}
		{#if checkIsJsonObject(entry[1])}
			<JsonFieldSelector
				json={entry[1]}
				{disabled}
				{onselect}
				baseJsonPath={[...baseJsonPath, entry[0]]}
				{isExpanded}
			/>
		{:else if !isExpanded}
			<div
				class={`lc-badge-${getJSONSchemaTypeByValue(entry[1])} inline-block h-4 rounded-xl px-2 py-0 text-xs text-white hover:bg-primary/20`}
				style="width: content-fit;"
			>
				{getLowCMSTypeByValue(entry[1])}
			</div>
		{:else if ['array', 'array-of-objects'].includes(getLowCMSTypeByValue(entry[1]))}
			{JSON.stringify(entry[1], null, 2)}
		{:else if ['string'].includes(getLowCMSTypeByValue(entry[1]))}
			"{entry[1]}"
		{:else}
			{entry[1]}
		{/if},
	</div>
{/each}{isArray ? ']' : '}'}
