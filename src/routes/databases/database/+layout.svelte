<script lang="ts">
	// Libraries
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { liveQuery, type Subscription } from 'dexie';

	// Libraries - shadcn
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Toggle } from '$lib/components/ui/toggle';
	import * as Resizable from '$lib/components/ui/resizable';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Dialog from '$lib/components/ui/dialog';

	// Libraries - lucide
	import Boxes from 'lucide-svelte/icons/boxes';
	import FileText from 'lucide-svelte/icons/file-text';
	import Braces from 'lucide-svelte/icons/braces';

	// Utilities
	import { cap, getLanguageByUrl, requestPermission } from '$lib/utilities/utilities.svelte';

	// Types
	import {} from '$lib/types/types.svelte';

	// States
	import { appState } from '$lib/states/states.svelte';

	// IndexedDB
	import { db, deleteDatabaseConfigById, getDatabaseConfigById } from '$lib/db/db.js';

	// Constants and locales
	import { BASE_PATH, DATABASE_SECTIONS } from '$lib/constants/constants.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import StorageOption from '$lib/components/app/tag/storage-option/storage-option.svelte';
	import DeleteDbConfigDialog from '$lib/components/app/dialog/delete-db-config-dialog/delete-db-config-dialog.svelte';
	import AddDbConfigDialog from '$lib/components/app/dialog/add-db-config-dialog/add-db-config-dialog.svelte';

	// Components
	import AuthorizeDirectoryUsageDialog from '$lib/components/app/dialog/authorize-directory-usage-dialog/authorize-directory-usage-dialog.svelte';

	// import type { PageProps } from '$types';

	const { data, children } = $props();
	const { loadingState, databaseConfig, isPermitted } = data;

	const databaseSection = $derived.by(() => {
		const sections = (page.route.id ?? '').split('/');
		const databaseSection = sections[3];
		return databaseSection;
	});

	// Automatic Link Localisation seems not working in layout?
	const lang = getLanguageByUrl(page.url.toString());
	const localizedDatabaseSections = $derived.by(() => {
		return DATABASE_SECTIONS.map((section) => {
			return {
				...section,
				// @ts-ignore Ignore string not in inlang's type issue for now
				name: m[section.inlangId]({ languageTag: lang })
			};
		});
	});
</script>

{#if appState.showsAside}
	<aside class="lc-aside absolute flex">
		<nav class="flex flex-col items-center gap-4 px-2 sm:py-5">
			{#each localizedDatabaseSections as section}
				<Tooltip.Root>
					<Tooltip.Trigger asChild let:builder>
						<a
							href={`/${BASE_PATH}/databases/database${section.path}${window.location.search}`}
							class={`lc-menu-icon-button ` +
								(databaseSection === section.inlangId ? 'lc-menu-icon-button-active' : '')}
							use:builder.action
							{...builder}
						>
							{#if section.inlangId === 'overview'}
								<Boxes class="lc-icon" />
							{:else if section.inlangId === 'schema'}
								<Braces class="lc-icon" />
							{:else}
								<FileText class="lc-icon" />
							{/if}
							<span class="sr-only">{section.name}</span>
						</a>
					</Tooltip.Trigger>
					<Tooltip.Content side="right">{section.name}</Tooltip.Content>
				</Tooltip.Root>
			{/each}
		</nav>
	</aside>
{/if}
<div class={`flex flex-col gap-2 ${appState.showsAside ? 'relative ml-14' : ''}`}>
	{@render children()}
	<AuthorizeDirectoryUsageDialog
		open={!isPermitted}
		{loadingState}
		directoryHandle={databaseConfig?.directoryHandle!}
	/>
</div>
