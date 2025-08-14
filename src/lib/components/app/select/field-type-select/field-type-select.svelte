<script lang="ts">
	// Libraries - shadcn
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	// Libraries - lucide
	import Braces from 'lucide-svelte/icons/braces';
	import CircleHelp from 'lucide-svelte/icons/circle-help';
	import Hash from 'lucide-svelte/icons/hash';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import TypeIcon from 'lucide-svelte/icons/type';
	import Workflow from 'lucide-svelte/icons/workflow';
	// Constants and locales
	import { FIELD } from '$lib/constants/constants.svelte';
	import * as m from '$lib/paraglide/messages.js';
	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';
	// Types
	import type { JSONSchema7TypeName } from 'json-schema';
	import IdCardLanyard from 'lucide-svelte/icons/id-card-lanyard';

	interface Props {
		fieldType: JSONSchema7TypeName | undefined;
		disabled: boolean;
		handleDataTypeChange: (item: unknown) => void;
	}
	let { fieldType = $bindable(), disabled, handleDataTypeChange }: Props = $props();
</script>

{#snippet FieldTypeIcon(jsonSchemaType: string)}
	<span class={`h-5 w-5 lc-badge-${jsonSchemaType} mr-2 flex items-center justify-center`}>
		{#if jsonSchemaType === 'string'}
			<TypeIcon class="v h-3.5 w-3.5" />
		{:else if ['number', 'integer'].includes(jsonSchemaType)}
			<Hash class="v h-3.5 w-3.5" />
		{:else if ['boolean'].includes(jsonSchemaType)}
			<ToggleRight class="v h-3.5 w-3.5" />
		{:else if ['x_id_uuid', 'x_id_nanoid'].includes(jsonSchemaType)}
			<IdCardLanyard class="v h-3.5 w-3.5" />
		{:else if ['x_relationship_one_to_one', 'x_relationship_one_to_many'].includes(jsonSchemaType)}
			<Workflow class="v h-3.5 w-3.5" />
		{:else if ['array', 'object'].includes(jsonSchemaType)}
			<Braces class="v h-3.5 w-3.5" />
		{:else if ['unknown'].includes(jsonSchemaType)}
			<CircleHelp class="v h-3.5 w-3.5" />
		{/if}
	</span>
{/snippet}

<Label for="field-type">
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
	<Select.Trigger id="field-type">
		<!-- TODO: workaround to show selected value -->
		{#if fieldType}
			<div class="flex items-center">
				{@render FieldTypeIcon(fieldType)}{cap(
					m[fieldType as Exclude<JSONSchema7TypeName, 'null'>]?.() ?? ''
				)}
			</div>
		{:else}
			<Select.Value placeholder={cap(m.data_type()) + ' *'} />
		{/if}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			{#each FIELD.types.filter((t) => t !== 'null') as jsonSchemaType}
				<Select.Item value={jsonSchemaType} label={cap(m[jsonSchemaType]())}>
					{@render FieldTypeIcon(jsonSchemaType)}
					{cap(m[jsonSchemaType]())}
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
