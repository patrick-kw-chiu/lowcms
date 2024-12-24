<!--
@component

`EnumEditor` supports 2 modes
- (When `onUpdateEnumFilter` is falsy) Add/remove `enums` for a schema field
- (When `onUpdateEnumFilter` is truthy) Edit the `filterObject` to filter by `enums`
-->
<script lang="ts">
	// Libraries - shadcn
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';

	// Libraries - lucide
	import EyeClosed from 'lucide-svelte/icons/eye-closed';

	// Types
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	import type { JSONObject, StringOpType } from '$lib/types/types.svelte';
	import type { Selected } from 'bits-ui';

	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';
	import { JSON_SCHEMA, StringFilterOperatorOptions } from '$lib/constants/constants.svelte';

	// Components
	import RemovableSelect from '../../removable-select/removable-select.svelte';

	interface Props {
		onSearch: (opType: StringOpType, opValue: string) => void;
		opType?: StringOpType;
		opValue?: string;
	}
	let { onSearch, opType, opValue }: Props = $props();
	let _opType = $state(opType);
	let _opValue = $state(opValue);
</script>

<div class="w-full">
	<div class="mb-2 text-base">
		<!-- TODO locales -->
		Filter by text
	</div>
	<div class="mb-2 flex flex-col items-center gap-2">
		<RemovableSelect
			options={StringFilterOperatorOptions}
			onSelectedChange={(item) => {
				const { value } = item as Selected<string>;
				_opType = value as StringOpType;
			}}
			bind:value={_opType}
			placeholder={cap(m.select_x({ x: m.operator() }))}
		/>
		<Input
			id="op-value"
			bind:value={_opValue}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					onSearch(_opType!, _opValue!);
				}
			}}
		/>
		<Button
			size="sm"
			class="w-full"
			disabled={_opType === opType && _opValue === opValue}
			onclick={() => onSearch(_opType!, _opValue!)}
		>
			{cap(m.search())}
		</Button>
	</div>
</div>
