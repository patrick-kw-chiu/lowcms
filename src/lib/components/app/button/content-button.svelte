<script lang="ts">
	// Libraries - shadcn
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Popover from '$lib/components/ui/popover';
	import Button from '$lib/components/ui/button/button.svelte';

	// Libraries - lucide
	import CircleHelp from 'lucide-svelte/icons/circle-help';
	import Trash2 from 'lucide-svelte/icons/trash-2';

	// Types
	import type { Content, Schema } from '$lib/types/types.svelte';

	// Utilities
	import { cap, checkHasIDField, getQueryString } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';

	// Components
	import ConfirmToRemove from '$lib/components/app/popover/confirm-to-remove.svelte';
	import { deleteContentById } from '$lib/db/db';
	import { invalidateAll } from '$app/navigation';
	import IdCardLanyard from 'lucide-svelte/icons/id-card-lanyard';

	interface Props {
		content: Content;
		schemas: Schema[];
		onclick: (_viewDocumentAs?: 'document' | 'documentsGroup') => void;
	}
	let { content, schemas, onclick }: Props = $props();
	let badgeType = $derived(
		content.type === 'collection' ? 'string' : content.type === 'object' ? 'number' : 'boolean'
	);

	let isViewOptionPopoverOpen = $state(false);
	let isHovered = $state(false);
	let isRemovePopoverOpen = $state(false);

	const handleConfirmToRemove = async () => {
		await deleteContentById(content.id);
		invalidateAll();

		const urlParams = new URLSearchParams(window.location.search);
		const databaseId = urlParams.get('databaseId');
		window.location.replace(
			window.location.pathname +
				getQueryString({
					databaseId
				})
		);
	};
</script>

<button
	class="relative flex items-center gap-2 overflow-hidden rounded-lg p-2 hover:bg-background"
	onclick={() => {
		if (content.type === 'collection') {
			onclick();
		} else {
			isViewOptionPopoverOpen = true;
		}
	}}
	onmouseover={() => (isHovered = true)}
	onfocus={() => (isHovered = true)}
	onmouseout={() => (isHovered = false)}
	onblur={() => (isHovered = false)}
>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<div class={`h-6 w-6 lc-badge-${badgeType} flex items-center justify-center rounded-lg`}>
				{content.type[0].toUpperCase()}
			</div>
		</Tooltip.Trigger>
		<Tooltip.Content side="right">
			{cap(m[content.type as 'collection' | 'document']())}
		</Tooltip.Content>
	</Tooltip.Root>
	<div class="flex flex-col overflow-hidden text-left">
		<div class="flex items-center gap-1 whitespace-nowrap">
			{#if checkHasIDField($state.snapshot(schemas.find((schema) => schema.id === content.schemaId)!))}
				<Tooltip.Root>
					<Tooltip.Trigger>
						<IdCardLanyard class="h-5 w-5" />
					</Tooltip.Trigger>
					<Tooltip.Content side="bottom">
						<!-- TODO locales -->
						This content's schema contains ID field(s)
					</Tooltip.Content>
				</Tooltip.Root>
			{/if}{content.name}
		</div>
		<div class="whitespace-nowrap text-xs text-muted-foreground">
			{content.description}
		</div>
	</div>
	<Button
		variant="ghost"
		size="icon"
		class={`absolute right-1.5 h-7 w-7 ${isHovered ? '' : 'opacity-0'}`}
		onclick={(e: Event) => {
			e.stopPropagation();
			console.log('hey');
			isRemovePopoverOpen = true;
		}}
	>
		<Trash2 class="h-5 w-5" />
	</Button>
</button>
<Popover.Root bind:open={isViewOptionPopoverOpen}>
	<Popover.Trigger></Popover.Trigger>
	<Popover.Content class="border-3 w-66 flex flex-col gap-2">
		<Button
			onclick={() => {
				isViewOptionPopoverOpen = false;
				onclick('document');
			}}
		>
			{cap(m.view_as_x({ x: m.document() }))}
		</Button>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button
					class="gap-1"
					onclick={() => {
						isViewOptionPopoverOpen = false;
						onclick('documentsGroup');
					}}
				>
					{cap(m.view_as_x({ x: m.documentsGroup() }))}<CircleHelp />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content class="w-72">
				{cap(m.view_as_documents_group_description())}
			</Tooltip.Content>
		</Tooltip.Root>
	</Popover.Content>
</Popover.Root>
<ConfirmToRemove
	bind:open={isRemovePopoverOpen}
	deleteTarget={`"${content.name}"`}
	onConfirm={handleConfirmToRemove}
	onCancel={() => {
		console.log('cancel');
	}}
/>
