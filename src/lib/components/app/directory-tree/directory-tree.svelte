<script lang="ts">
	// Libraries
	import { availableLanguageTags, languageTag } from '$lib/paraglide/runtime.js';
	import { i18n } from '$lib/i18n';
	import { page } from '$app/state';

	// Libraries - shadcn
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import * as Accordion from '$lib/components/ui/accordion';

	import * as m from '$lib/paraglide/messages.js';

	// Utilities
	import { cap, enumerateDirectory } from '$lib/utilities/utilities.svelte';

	// Components
	import DirectoryTree from './directory-tree.svelte';
	import FileItem from './file-item.svelte';

	// Constants
	import { LANGUAGE_LABEL } from '$lib/constants/constants.svelte';
	import type { DirectoryWithInfo } from '$lib/types/types.svelte';

	interface Props {
		directoryHandle: FileSystemDirectoryHandle;
		open?: boolean;
		notifyParent?: (value: string) => void;
		onselect: (fileHandle: FileSystemFileHandle) => void;
	}
	let {
		directoryHandle,
		open = false,
		notifyParent: notifyParentOfParent,
		onselect
	}: Props = $props();

	let directories: { directories: DirectoryWithInfo[]; files: FileSystemFileHandle[] } = $state({
		directories: [],
		files: []
	});
	const loadDirectory = async (directoryHandle: FileSystemDirectoryHandle) => {
		directories = await enumerateDirectory(directoryHandle);
	};
	$effect(() => {
		if (open && directoryHandle) {
			loadDirectory(directoryHandle);
		}
	});

	let openedDirectory = $state<string[]>([]);

	const getValue = () => {
		return open ? directoryHandle.name : '';
	};

	const setValue = (newValue: string) => {
		notifyParentOfParent?.(newValue);
	};

	const notifyParent = (newValue: string) => {
		console.log({ newValue });
		if (newValue) {
			openedDirectory.push(newValue);
		}
	};
</script>

<Accordion.Root class="w-full" bind:value={getValue, setValue}>
	<Accordion.Item value={directoryHandle.name} class="border-b-0">
		<Accordion.Trigger class="p-0">{directoryHandle.name}</Accordion.Trigger>
		<Accordion.Content class="pb-0 pl-3">
			{#each directories.directories as directory}
				<DirectoryTree
					directoryHandle={directory}
					{notifyParent}
					open={openedDirectory.includes(directory.name)}
					{onselect}
				/>
			{/each}
			{#each directories.files as file}
				<FileItem fileHandle={file} {onselect} />
			{/each}
		</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>
