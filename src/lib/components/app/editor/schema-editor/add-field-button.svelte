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
	import type { JSONSchema7 } from 'json-schema';

	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';
	import { JSON_SCHEMA } from '$lib/constants/constants.svelte';

	// Components
	import FieldEditor from './field-editor/field-editor.svelte';

	interface Props {
		onAddField: (
			field: string,
			schema: JSONSchema7,
			options?: {
				beforeField?: string;
			}
		) => void;
		isRoot?: boolean;
		entry?: [string, any];
		isEmpty?: boolean;
	}
	let { onAddField, isRoot, entry, isEmpty = false }: Props = $props();

	let isOpen = $state(false);
	let isHovered = $state(false);

	const reset = () => {
		isOpen = false;
		isHovered = false;
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
		{#if isEmpty}
			<Button
				builders={[builder]}
				variant="ghost"
				size="icon"
				class="absolute"
				style={`transform: translateX(-1.45rem); top: ${isRoot ? '0.1rem' : '-0.75rem'}`}
			>
				<CirclePlus
					class="h-5 w-5"
					onmouseover={() => (isHovered = true)}
					onfocus={() => (isHovered = true)}
					onmouseout={() => (isHovered = false)}
					onblur={() => (isHovered = false)}
				/>
			</Button>
		{:else}
			<div
				class={`absolute h-[4px] ${isOpen || isHovered ? '' : 'overflow-hidden'}`}
				style="width: calc(100% - 0.5rem)"
			>
				<hr
					class={`h-[4px] opacity-0 ${isOpen || isHovered ? 'opacity-100' : ''}`}
					onmouseover={() => (isHovered = true)}
					onfocus={() => (isHovered = true)}
					onmouseout={() => (isHovered = false)}
					onblur={() => (isHovered = false)}
				/>
				<Button
					builders={[builder]}
					variant="ghost"
					size="icon"
					class={`absolute -top-4 right-0 h-8 w-8 ${isOpen || isHovered ? '' : 'hidden'}`}
				>
					<CirclePlus
						class="h-5 w-5"
						onmouseover={() => (isHovered = true)}
						onfocus={() => (isHovered = true)}
						onmouseout={() => (isHovered = false)}
						onblur={() => (isHovered = false)}
					/>
				</Button>
			</div>
		{/if}
	</Popover.Trigger>
	<Popover.Content
		class="border-3 w-96 overflow-scroll"
		style="max-height: calc(50dvh - 60px); min-height: 320px"
	>
		<FieldEditor
			onConfirmFieldDetail={(field, schema) => {
				onAddField(field, schema, { beforeField: entry?.[0] });
				reset();
			}}
			disabled={false}
		/>
	</Popover.Content>
</Popover.Root>
