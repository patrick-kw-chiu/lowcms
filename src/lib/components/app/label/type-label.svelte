<script lang="ts">
	import type { JSONSchema7 } from 'json-schema';

	interface Props {
		config: JSONSchema7;
	}
	let { config }: Props = $props();
</script>

<span>
	{config.type === 'array'
		? `${config.type} of ${(config!.items as JSONSchema7)!.type}(s)`
		: config.type}
</span>
