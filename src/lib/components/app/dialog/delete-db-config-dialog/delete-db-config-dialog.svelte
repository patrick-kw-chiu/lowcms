<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';

	interface Props {
		open: boolean;
		name?: string;
		id?: string;
		deleteDbConfig: MouseEventHandler<HTMLButtonElement>;
	}
	let { open = $bindable(), name, id, deleteDbConfig }: Props = $props();

	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';

	import * as m from '$lib/paraglide/messages.js';

	import { cap } from '$lib/utilities/utilities.svelte';
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>{cap(m._delete())}</Dialog.Title>
				<Dialog.Description>
					<br />
					{cap(
						m.confirm_to_x({
							x: `${m._delete()} ${name}`
						})
					)}
					<br />
					ID: {id}
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button type="submit" onclick={deleteDbConfig}>
					{cap(m.confirm())}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
