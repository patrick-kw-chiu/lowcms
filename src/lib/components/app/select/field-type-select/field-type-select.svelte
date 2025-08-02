<script lang="ts">
	// Libraries - shadcn
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';

	// Libraries - lucide
	import TypeIcon from 'lucide-svelte/icons/type';
	import Hash from 'lucide-svelte/icons/hash';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import Braces from 'lucide-svelte/icons/braces';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';
	import { FIELD } from '$lib/constants/constants.svelte';

	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';

	// Types
	import type { JSONSchema7TypeName } from 'json-schema';

	interface Props {
		fieldType: JSONSchema7TypeName | undefined;
		disabled: boolean;
		handleDataTypeChange: (item: unknown) => void;
	}
	let { fieldType = $bindable(), disabled, handleDataTypeChange }: Props = $props();
</script>

<Label for="data-type">
	<!-- TODO locales -->
	Field type *
</Label>
<Select.Root
	portal={null}
	selected={{ value: fieldType }}
	onSelectedChange={handleDataTypeChange}
	required
	{disabled}
>
	<Select.Trigger id="data-type">
		<!-- TODO: workaround to show selected value -->
		{#if fieldType}
			{fieldType}
		{:else}
			<Select.Value placeholder={cap(m.data_type()) + ' *'} />
		{/if}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			{#each FIELD.types.filter((t) => t !== 'null') as jsonSchemaType}
				<Select.Item value={jsonSchemaType} label={cap(m[jsonSchemaType]())}>
					<span class={`h-5 w-5 lc-badge-${jsonSchemaType} mr-2 flex items-center justify-center`}>
						{#if jsonSchemaType === 'string'}
							<TypeIcon class="v h-3.5 w-3.5" />
						{:else if ['number', 'integer'].includes(jsonSchemaType)}
							<Hash class="v h-3.5 w-3.5" />
						{:else if ['boolean'].includes(jsonSchemaType)}
							<ToggleRight class="v h-3.5 w-3.5" />
						{:else}
							<Braces class="v h-3.5 w-3.5" />
						{/if}
					</span>
					{cap(m[jsonSchemaType]())}
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
