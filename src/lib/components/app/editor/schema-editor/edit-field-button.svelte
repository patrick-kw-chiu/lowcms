<script lang="ts">
	// Libraries - shadcn
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	// Libraries - lucide
	// Types
	import type { JSONObject } from '$lib/types/types.svelte';
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	// Utilities
	import { pick } from '$lib/utilities/utilities.svelte';
	// Constants and locales
	import { FIELD } from '$lib/constants/constants.svelte';
	// Components
	import Trash_2 from 'lucide-svelte/icons/trash-2';
	import TypeLabel from '../../label/type-label.svelte';
	import FieldEditor from './field-editor/field-editor.svelte';

	interface Props {
		field: string;
		jsonSchema: JSONObject;
		onEditField: (field: string, newField: string, schema: JSONSchema7) => void;
		onRemoveField: (field: string) => void;
		disabled: boolean;
	}
	let { field, jsonSchema, onEditField, onRemoveField, disabled }: Props = $props();

	let isOpen = $state(false);
	let isHovered = $state(false);

	console.log({ field, jsonSchema: $state.snapshot(jsonSchema) });

	const reset = () => {
		isOpen = false;
	};
</script>

<Popover.Root
	portal={null}
	bind:open={isOpen}
	onOpenChange={(value) => {
		if (!value) {
			reset();
		}
	}}
>
	<Popover.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="ghost"
			size="sm"
			class={`lc-badge-${jsonSchema.type} h-4 rounded-xl px-2 text-xs`}
			style="width: content-fit;"
			onmouseover={() => (isHovered = true)}
			onfocus={() => (isHovered = true)}
			onmouseout={() => (isHovered = false)}
			onblur={() => (isHovered = false)}
		>
			<TypeLabel config={jsonSchema} />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="border-3 w-96" style={`max--height: 70dvh; min--height: 320px;`}>
		<button
			class="absolute right-2 z-30"
			{disabled}
			onclick={() => {
				onRemoveField(field);
				reset();
			}}
		>
			<Trash_2 class="h-6 w-6" />
		</button>
		<FieldEditor
			{field}
			{jsonSchema}
			keywordObj={pick(jsonSchema, FIELD[jsonSchema.type as JSONSchema7TypeName].keywords)}
			onConfirmFieldDetail={(newField, schema) => {
				onEditField(field, newField, schema);
				reset();
			}}
			{disabled}
		/>
	</Popover.Content>
</Popover.Root>
