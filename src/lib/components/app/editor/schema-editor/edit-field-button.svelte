<script lang="ts">
	// Libraries - shadcn
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';

	// Libraries - lucide
	import CirclePlus from 'lucide-svelte/icons/circle-plus';

	// Types
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	import type { JSONObject } from '$lib/types/types.svelte';

	// Utilities
	import { cap, pick } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';
	import { JSON_SCHEMA } from '$lib/constants/constants.svelte';

	// Components
	import FieldEditor from './field-editor/field-editor.svelte';
	import TypeLabel from '../../label/type-label.svelte';
	import Trash_2 from 'lucide-svelte/icons/trash-2';

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
	<Popover.Content
		class="border-3 w-80 overflow-scroll"
		style="max-height: calc(50dvh - 60px); min-height: 240px"
	>
		<button
			class="z-100 absolute right-2"
			onclick={() => {
				onRemoveField(field);
				reset();
			}}
		>
			<Trash_2 />
		</button>
		<FieldEditor
			{field}
			{jsonSchema}
			keywordObj={pick(jsonSchema, JSON_SCHEMA[jsonSchema.type as JSONSchema7TypeName].keywords)}
			onConfirmFieldDetail={(newField, schema) => {
				onEditField(field, newField, schema);
				reset();
			}}
			{disabled}
		/>
	</Popover.Content>
</Popover.Root>
