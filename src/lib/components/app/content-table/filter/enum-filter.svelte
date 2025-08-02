<!--
@component

`EnumFilter` edit the `filterObject` to filter the rows by `enums`
-->
<script lang="ts">
	// Libraries - shadcn
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';

	// Libraries - lucide
	import X from 'lucide-svelte/icons/x';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeClosed from 'lucide-svelte/icons/eye-closed';

	// Types
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	import type { JSONObject } from '$lib/types/types.svelte';

	// Utilities
	import { cap, extractWhitespaceParts } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';
	import {} from '$lib/constants/constants.svelte';
	import type { Selected } from 'bits-ui';

	interface Props {
		keywordObj: JSONSchema7;
		onUpdateEnumFilter: (enums: string[] | 'all') => void;
		enums?: string[];
	}
	let { keywordObj = $bindable(), onUpdateEnumFilter, enums }: Props = $props();

	// Filter mode
	let rawEnums = $state<string[]>(
		(keywordObj.enum ?? (keywordObj?.items as JSONSchema7)?.enum) as string[]
	);
	let isAcceptAllValue = $state(!Boolean(enums));
	let enumsToInclude = $state<string[]>(enums ?? rawEnums);
	console.log({ rawEnums, enumsToInclude, keywordObj });
</script>

<div class="w-full">
	<div class="mb-2 text-base">
		<!-- TODO locales -->
		Filter by enums
	</div>
	<div class="mb-2 flex items-center gap-2">
		<Checkbox
			checked={isAcceptAllValue}
			onCheckedChange={(checked) => {
				isAcceptAllValue = checked as boolean;
				enumsToInclude = rawEnums;
				if (checked) {
					onUpdateEnumFilter('all');
				} else {
					onUpdateEnumFilter(enumsToInclude);
				}
			}}
		/>
		<p class={`text-xs ${isAcceptAllValue ? '' : 'opacity-60'}`}>
			<!-- TODO locales -->
			Accept all value
		</p>
	</div>
	<div>
		{#each rawEnums as enumValue}
			<Badge
				class={`mb-1 mr-1 ${enumsToInclude.includes(enumValue) && !isAcceptAllValue ? '' : 'opacity-60'}`}
			>
				{#each extractWhitespaceParts(enumValue as string) as part}
					<span style={part.isWhiteSpace ? 'text-decoration: wavy underline;' : ''}>
						{part.content}
					</span>
				{/each}
				{#if enumsToInclude.includes(enumValue)}
					<Eye
						class="h-4 w-4 cursor-pointer"
						style="transform: translateX(0.125rem)"
						onclick={() => {
							isAcceptAllValue = false;
							enumsToInclude = enumsToInclude.filter((e) => e !== enumValue);
							onUpdateEnumFilter(enumsToInclude);
						}}
					/>
				{:else}
					<EyeClosed
						class="h-4 w-4 cursor-pointer"
						style="transform: translateX(0.125rem)"
						onclick={() => {
							isAcceptAllValue = false;
							enumsToInclude = [...enumsToInclude, enumValue];
							onUpdateEnumFilter(enumsToInclude);
						}}
					/>
				{/if}
			</Badge>
		{/each}
	</div>
</div>
