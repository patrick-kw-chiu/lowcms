<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	interface Props {
		trigger?: string;
		triggerComponent?: Snippet;
		title?: string;
		titleComponent?: Snippet;
		description?: string;
		descriptionComponent?: Snippet;
		onConfirm?: MouseEventHandler<HTMLButtonElement>;
	}

	let {
		trigger,
		triggerComponent,
		title,
		titleComponent,
		description,
		descriptionComponent,
		onConfirm = () => {}
	}: Props = $props();

	import * as m from '$lib/paraglide/messages.js';

	import * as Dialog from '$lib/components/ui/dialog';
	// import { cap } from '$lib/utilities/utilities.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { cap } from '$lib/utilities/utilities.svelte';

	console.log({
		trigger,
		triggerComponent,
		title,
		titleComponent,
		description,
		descriptionComponent,
		onConfirm
	});
</script>

<Dialog.Root>
	{#if trigger || triggerComponent}
		<Dialog.Trigger>
			{#if triggerComponent}
				{@render triggerComponent()}
			{:else}
				{trigger}
			{/if}
		</Dialog.Trigger>
	{/if}
	<Dialog.Content>
		<Dialog.Header>
			{#if title || titleComponent}
				<Dialog.Title>
					{#if titleComponent}
						{@render titleComponent()}
					{:else}
						{title}
					{/if}
				</Dialog.Title>
			{/if}
			{#if description || descriptionComponent}
				<Dialog.Description>
					{#if descriptionComponent}
						{@render descriptionComponent()}
					{:else}
						{description}
					{/if}
				</Dialog.Description>
			{/if}
		</Dialog.Header>
		<Dialog.Footer>
			<Button type="submit" onclick={onConfirm}>{cap(m.confirm())}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
