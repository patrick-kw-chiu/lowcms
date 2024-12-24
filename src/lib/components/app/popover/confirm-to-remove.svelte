<script lang="ts">
	// Libraries - shadcn
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Popover from '$lib/components/ui/popover';
	import Button from '$lib/components/ui/button/button.svelte';

	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		open: boolean;
		deleteTarget: string;
		onConfirm: () => void;
		onCancel: () => void;
	}
	let { open = $bindable(), deleteTarget, onConfirm, onCancel }: Props = $props();
</script>

<Popover.Root bind:open>
	<Popover.Trigger></Popover.Trigger>
	<Popover.Content class="border-3 w-66 flex flex-col gap-2">
		<Button
			variant="outline"
			size="sm"
			onclick={() => {
				open = false;
				onCancel();
			}}
		>
			{cap(m.cancel())}
		</Button>
		<Button
			variant="destructive"
			size="sm"
			onclick={() => {
				open = false;
				onConfirm();
			}}
		>
			{cap(m.confirm_to_x({ x: m.remove_x({ x: deleteTarget }) }))}
		</Button>
	</Popover.Content>
</Popover.Root>
