<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import type { Selected } from 'bits-ui';
	import CalendarClock from 'lucide-svelte/icons/calendar-clock';
	import CircleX from 'lucide-svelte/icons/circle-x';
	import IDCardLanyard from 'lucide-svelte/icons/id-card-lanyard';
	import LinkIcon from 'lucide-svelte/icons/link';
	import Mail from 'lucide-svelte/icons/mail';
	import Workflow from 'lucide-svelte/icons/workflow';

	interface Props {
		options: { value: string; label: string; iconName?: string }[];
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
							{#if option.iconName === 'id'}
								<IDCardLanyard class="h-5 w-5" />
							{:else if option.iconName === 'email'}
								<Mail class="h-5 w-5" />
							{:else if ['date', 'datetime', 'time'].includes(option.iconName!)}
								<CalendarClock class="h-5 w-5" />
							{:else if option.iconName === 'url'}
								<LinkIcon class="h-5 w-5" />
							{:else if option.iconName === 'relationship'}
								<Workflow class="h-5 w-5" />
							{/if}
							{option.label}
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>
		{#if onRemove}
			<Button variant="outline" size="icon" class="p-2" {disabled} onclick={onRemove}>
				<CircleX onclick={onRemove} />
			</Button>
		{/if}
	</div>
</div>
