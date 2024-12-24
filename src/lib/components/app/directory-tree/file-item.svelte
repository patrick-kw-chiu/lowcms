<script lang="ts">
	import { mode } from 'mode-watcher';

	import Braces from 'lucide-svelte/icons/braces';

	interface Props {
		fileHandle: FileSystemFileHandle;
		onselect: (fileHandle: FileSystemFileHandle) => void;
	}
	let { fileHandle, onselect }: Props = $props();
	let isJson = fileHandle.name.endsWith('.json');
	let isUsable = fileHandle.name.endsWith('.json');
</script>

<button
	class={`block w-full whitespace-nowrap text-left ${isUsable ? 'hover:bg-background' : 'cursor-not-allowed opacity-50'}`}
	onclick={() => onselect(fileHandle)}
	disabled={!isUsable}
>
	{#if isJson}
		<Braces class="inline-block h-3 w-3" color={mode.current === 'dark' ? 'yellow' : '#e6d200'} />
	{/if}
	<span>{fileHandle.name}</span>
</button>
