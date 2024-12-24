<script lang="ts">
	// Libraries
	import { availableLanguageTags, languageTag } from '$lib/paraglide/runtime.js';
	import { i18n } from '$lib/i18n';
	import { page } from '$app/state';

	// Libraries - shadcn
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';

	// Constants and locales
	import { BASE_PATH, LANGUAGE_LABEL } from '$lib/constants/constants.svelte';
	import * as m from '$lib/paraglide/messages.js';

	// Utilities
	import { getQueryString } from '$lib/utilities/utilities.svelte';
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button builders={[builder]} variant="outline">
			{m.LANGUAGE_LABEL()}
			<span class="sr-only">Toggle language</span>
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		{#each availableLanguageTags as lang}
			<DropdownMenu.Item
				on:click={() => {
					window.location.href =
						`/${BASE_PATH}` +
						(lang !== 'en' ? `/${lang}` : '') +
						page.route.id +
						window.location.search;
				}}
			>
				{LANGUAGE_LABEL[lang]}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
