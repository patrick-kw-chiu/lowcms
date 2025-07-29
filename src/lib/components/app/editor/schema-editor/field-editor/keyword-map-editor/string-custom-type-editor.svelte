<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { nanoid } from 'nanoid';

	// Types
	import type { JSONSchema7WithCustomKeyword } from '$lib/types/types.svelte';

	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';
	import { JSON_SCHEMA } from '$lib/constants/constants.svelte';
	import type { Selected } from 'bits-ui';
	import RemovableSelect from '$lib/components/app/removable-select/removable-select.svelte';

	interface Props {
		keywordObj: JSONSchema7WithCustomKeyword;
		disabled?: boolean;
	}
	let { keywordObj = $bindable(), disabled }: Props = $props();
	let xCustomStringType = $derived(keywordObj['x-string-custom-type']);
</script>

<RemovableSelect
	label="Custom type"
	value={xCustomStringType}
	options={JSON_SCHEMA.string.customTypes.map((t) => ({ label: t, value: t, withIcon: true }))}
	onSelectedChange={(item) => {
		const { value } = item as Selected<string>;
		keywordObj['x-string-custom-type'] = value;
	}}
	{disabled}
	onRemove={() => {
		console.log({ keywordObj });
		delete keywordObj['x-string-custom-type'];
		delete keywordObj.enum;
	}}
/>
{#if xCustomStringType}
	<p class="text-xs opacity-60">
		<!-- TODO locales -->
		{#if ['ID - uuid'].includes(xCustomStringType)}
			You can generate a UUID in LowCMS e.g. "{uuidv4()}", or input your own.
		{:else if ['ID - nanoid'].includes(xCustomStringType)}
			You can generate a nanoid in LowCMS e.g. "{nanoid(32)}", or input your own.
		{/if}
	</p>
{/if}
