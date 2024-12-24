<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';

	import * as m from '$lib/paraglide/messages.js';
	import { goto } from '$app/navigation';
	import { languageTag } from '$lib/paraglide/runtime.js';

	import { cap, requestPermission } from '$lib/utilities/utilities.svelte';

	interface Props {
		open: boolean;
		loadingState: 'not-found' | 'success' | 'pending';
		directoryHandle: FileSystemDirectoryHandle;
	}
	let { open = $bindable(), loadingState, directoryHandle }: Props = $props();

	const requestPermissionAndReload = async () => {
		const success = await requestPermission(directoryHandle!);
		if (success) {
			window.location.reload();
		}
	};
</script>

<Dialog.Root
	{open}
	onOpenChange={() => {
		throw 'dont close';
	}}
>
	<Dialog.Content id="reauthorize-dialog">
		<Dialog.Header>
			<Dialog.Title>
				{cap(loadingState === 'not-found' ? m.x_not_found({ x: m.directory() }) : m.authorize())}
			</Dialog.Title>
			{#if loadingState === 'success'}
				<Dialog.Description>
					{cap(m.authorize_description())} <b>{directoryHandle?.name}</b>
				</Dialog.Description>
			{/if}
		</Dialog.Header>
		<Dialog.Footer>
			{#if loadingState === 'success'}
				<Button onclick={requestPermissionAndReload}>{cap(m.authorize())}</Button>
			{/if}
			<Button
				variant="secondary"
				onclick={() => {
					goto(`/lowcms${languageTag() !== 'en' ? `/${languageTag()}` : ''}/databases`);
				}}
			>
				{cap(m.back_to_x_page({ x: m.databases() }))}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(#reauthorize-dialog button[data-dialog-close]) {
		display: none;
	}
</style>
