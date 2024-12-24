<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
	}
	let { class: className }: Props = $props();
</script>

<hr class={cn('mb-4 border-b-2 border-b-background', className)} />
