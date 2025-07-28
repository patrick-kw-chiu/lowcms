<script lang="ts">
	import type { JSONSchema7WithCustomKeyword } from '$lib/types/types.svelte';

	interface Props {
		config: JSONSchema7WithCustomKeyword;
	}
	let { config }: Props = $props();
</script>

<span>
	{config.type === 'array'
		? `${config.type} of ${(config!.items as JSONSchema7WithCustomKeyword)!.type}(s)`
		: config.type === 'string' && config['x-custom-string-type']
			? `${config.type} | ${config['x-custom-string-type']}`
			: config.type}
</span>
