<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import { cap } from '$lib/utilities/utilities.svelte';
	import type { Selected } from 'bits-ui';
	import * as m from '$lib/paraglide/messages.js';
	import CircleX from 'lucide-svelte/icons/circle-x';

	interface Props {
		options: { value: string; label: string }[];
		onSelectedChange: (item: Selected<string | undefined> | undefined) => void;
		value?: string;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		onRemove?: () => void;
	}
	let {
		options,
		onSelectedChange,
		value = $bindable(),
		label,
		placeholder,
		disabled,
		onRemove
	}: Props = $props();
	const _label = $derived(options.find((option) => option.value === value)?.label);
</script>

<div class="flex w-full flex-col gap-2">
	{#if label}
		<Label for={`removable-select-${label}`}>{label}</Label>
	{/if}
	<div class="flex gap-2">
		<Select.Root
			portal={null}
			selected={{ value }}
			{onSelectedChange}
			disabled={options.length === 0}
		>
			<Select.Trigger id={label ? `removable-select-${label}` : ''}>
				{#if _label}
					{_label}
				{:else}
					<Select.Value {placeholder} />
				{/if}
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					{#each options as option}
						<Select.Item value={option.value} label={option.label}>
							{option.label}
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>
		{#if onRemove}
			<Button variant="outline" size="icon" class="p-2" {disabled} onclick={onRemove}>
				<CircleX />
			</Button>
		{/if}
	</div>
</div>
