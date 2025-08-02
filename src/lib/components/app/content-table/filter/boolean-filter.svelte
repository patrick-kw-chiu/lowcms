<!--
@component

`EnumEditor` supports 2 modes
- (When `onUpdateEnumFilter` is falsy) Add/remove `enums` for a schema field
- (When `onUpdateEnumFilter` is truthy) Edit the `filterObject` to filter by `enums`
-->
<script lang="ts">
	import { mode } from 'mode-watcher';
	// Libraries - shadcn
	import * as ToggleGroup from '$lib/components/ui/toggle-group';

	// Libraries - lucide
	import EyeClosed from 'lucide-svelte/icons/eye-closed';

	// Types
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	import type { JSONObject, NumberOpType } from '$lib/types/types.svelte';
	import type { Selected } from 'bits-ui';

	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';
	import { NumberFilterOperatorOptions } from '$lib/constants/constants.svelte';

	// Components
	import RemovableSelect from '../../removable-select/removable-select.svelte';

	interface Props {
		onToggle: (value: string) => void;
		opValue?: string;
	}
	let { onToggle, opValue = 'undefined' }: Props = $props();
</script>

<div class="w-full">
	<div class="mb-2 text-base">
		<!-- TODO locales -->
		Filter by boolean
	</div>
	<div class="w-fit">
		<ToggleGroup.Root variant="outline" type="single" bind:value={() => opValue, onToggle}>
			<ToggleGroup.Item
				class={`border-[2px] border-sky-800 ${opValue === 'true' ? '!bg-sky-800' : ''}`}
				style={opValue === 'true' && mode.current === 'light' ? 'color: white' : ''}
				value="true"
				aria-label="true"
			>
				{m._true()}
			</ToggleGroup.Item>
			<ToggleGroup.Item
				class={`border-[2px] border-sky-800 ${opValue === 'false' ? '!bg-sky-800' : ''}`}
				style={opValue === 'false' && mode.current === 'light' ? 'color: white' : ''}
				value="false"
				aria-label="false"
			>
				{m._false()}
			</ToggleGroup.Item>
		</ToggleGroup.Root>
	</div>
</div>
