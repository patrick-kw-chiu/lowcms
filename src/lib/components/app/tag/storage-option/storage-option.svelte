<script lang="ts">
	import { type DatabaseConfig } from '$lib/types/types.svelte';

	interface Props {
		storageOption: DatabaseConfig['storageOption'];
	}
	let { storageOption }: Props = $props();

	import * as m from '$lib/paraglide/messages.js';

	import { cap } from '$lib/utilities/utilities.svelte';
	import Globe from 'lucide-svelte/icons/globe';
	import HardDrive from 'lucide-svelte/icons/hard-drive';
</script>

<div>
	<span class="inline-block">
		{cap(m[storageOption]())}
	</span>
	<span class="inline-block">
		{#if storageOption === 'local'}
			<HardDrive class="lc-icon" />
		{:else}
			<Globe class="lc-icon" />
		{/if}
	</span>
</div>

<style>
	span {
		vertical-align: middle;
	}
</style>
