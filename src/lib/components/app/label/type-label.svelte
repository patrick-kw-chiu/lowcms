<script lang="ts">
	import type { JSONSchema7WithCustomKeyword } from '$lib/types/types.svelte';

	import * as m from '$lib/paraglide/messages.js';
	import { type JSONSchema7TypeName } from 'json-schema';
	interface Props {
		config: JSONSchema7WithCustomKeyword;
	}
	let { config }: Props = $props();
	let _type = $derived(config.type) as unknown as Exclude<JSONSchema7TypeName, 'null'>;
</script>

<span>
	{['x_id_uuid', 'x_id_nanoid', 'x_relationship_one_to_one', 'x_relationship_one_to_many'].includes(
		_type
	)
		? m[_type]()
		: _type === 'array'
			? `${_type} of ${(config!.items as JSONSchema7WithCustomKeyword)!.type}(s)`
			: config.type}
</span>
