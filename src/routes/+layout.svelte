<script lang="ts">
	// Global styles
	import '../app.css';

	// Libraries
	import { i18n } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import { languageTag } from '$lib/paraglide/runtime.js';

	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Tooltip from '$lib/components/ui/tooltip';

	import Database from 'lucide-svelte/icons/database';
	import PanelLeft from 'lucide-svelte/icons/panel-left';
	import Search from 'lucide-svelte/icons/search';
	import Settings from 'lucide-svelte/icons/settings';
	import LayoutTemplate from 'lucide-svelte/icons/layout-template';
	import SquareChevronLeft from 'lucide-svelte/icons/square-chevron-left';
	import SquareChevronRight from 'lucide-svelte/icons/square-chevron-right';

	// States
	import { appState } from '$lib/states/states.svelte';

	// Utilities
	import {
		setState,
		getSectionInfoByPage,
		getLanguageByUrl
	} from '$lib/utilities/utilities.svelte';

	// Constants
	import { BASE_PATH, SECTIONS } from '$lib/constants/constants.svelte';

	// Components
	import DarkModeSwitchButton from '$lib/components/app/switch-button/dark-mode-switch-button/dark-mode-switch-button.svelte';
	import LanguageSwitchButton from '$lib/components/app/switch-button/language-switch-button/language-switch-button.svelte';

	// Automatic Link Localisation seems not working in layout?
	const lang = getLanguageByUrl(page.url.toString());
	const langPrefix = lang ? `/${lang}` : '';
	const localizedSections = $derived.by(() => {
		return SECTIONS.map((section) => {
			return {
				...section,
				// @ts-ignore Ignore string not in inlang's type issue for now
				name: m[section.inlangId]({ languageTag: lang })
			};
		});
	});

	const { children } = $props();

	$effect(() => {
		const sectionInfo = getSectionInfoByPage(page);
		setState(appState, sectionInfo);
	});
</script>

<ModeWatcher />
<ParaglideJS {i18n}>
	<div class="flex min-h-screen w-full flex-col bg-muted/40">
		{#if appState.showsAside}
			<aside class="lc-aside fixed hidden w-14 sm:flex">
				<nav class="flex flex-col items-center gap-4 px-2 sm:py-5">
					<div
						class="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
						style="background-color: rgb(241, 241, 241);"
					>
						<img
							src={`/${BASE_PATH}/logo.png`}
							alt="Logo"
							class="h-6 w-6 transition-all group-hover:scale-110"
						/>
						<span class="sr-only">Low CMS</span>
					</div>
					{#each localizedSections as section}
						<Tooltip.Root>
							<Tooltip.Trigger asChild let:builder>
								<a
									href={`/${BASE_PATH}${langPrefix}${section.path}`}
									class={`lc-menu-icon-button ${!section.disabled ? 'lc-menu-icon-button-active' : 'lc-menu-icon-button-disabled'}`}
									use:builder.action
									{...builder}
								>
									{#if section.inlangId === 'databases'}
										<Database class="lc-icon" />
									{:else}
										<LayoutTemplate class="lc-icon" />
									{/if}
									<span class="sr-only">{section.name}</span>
								</a>
							</Tooltip.Trigger>
							<Tooltip.Content side="right">{section.name}</Tooltip.Content>
						</Tooltip.Root>
					{/each}
				</nav>
				{#if appState.showsAside}
					<nav class="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
						<Button
							variant="link"
							size="icon"
							onclick={() => {
								appState.showsAside = false;
							}}
						>
							<SquareChevronLeft />
						</Button>
					</nav>
				{/if}
			</aside>
		{/if}
		<div
			class={`flex flex-col ${appState.showsAside ? 'sm:pl-14' : ''}` +
				(!appState.isSubSection ? ' sm:gap-4 sm:py-4' : ' sm:gap-2 sm:pt-2')}
		>
			<header
				class={'sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background sm:static sm:h-auto sm:border-0 sm:bg-transparent' +
					(!appState.isSubSection ? ' px-4 sm:px-6' : ' px-2 sm:px-3')}
			>
				<Sheet.Root>
					<Sheet.Trigger asChild let:builder>
						<Button builders={[builder]} size="icon" variant="outline" class="sm:hidden">
							<PanelLeft class="lc-icon" />
							<span class="sr-only">Toggle Menu</span>
						</Button>
					</Sheet.Trigger>
					<Sheet.Content side="left" class="sm:max-w-xs">
						<nav class="grid gap-6 text-lg font-medium">
							<a
								href="##"
								class="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
								style="background-color: rgb(241, 241, 241);"
							>
								<img
									src={`/${BASE_PATH}/logo.png`}
									alt="Logo"
									class="h-7 w-7 transition-all group-hover:scale-110"
								/>
								<span class="sr-only">Low CMS</span>
							</a>
							{#each localizedSections as section}
								<a
									href={`/${BASE_PATH}${langPrefix}${section.path}`}
									class={`flex items-center gap-4 px-2.5 text-muted-foreground ${!section.disabled ? 'hover:text-foreground' : 'cursor-not-allowed opacity-25'}`}
								>
									{#if section.name === 'Databases'}
										<Database class="lc-icon" />
									{:else}
										<LayoutTemplate class="lc-icon" />
									{/if}
									{section.name}
								</a>
							{/each}
						</nav>
					</Sheet.Content>
				</Sheet.Root>
				{#if !appState.showsAside}
					<Button
						variant="outline"
						size="icon"
						onclick={() => {
							appState.showsAside = true;
						}}
					>
						<SquareChevronRight />
					</Button>
				{/if}
				<Breadcrumb.Root class="hidden md:flex">
					<Breadcrumb.List>
						{#each appState.breadcrumbItems as breadcrumbItem, index}
							<Breadcrumb.Item>
								{#if index !== appState.breadcrumbItems.length - 1}
									<Breadcrumb.Link href={breadcrumbItem.path}>
										{breadcrumbItem.name}
									</Breadcrumb.Link>
								{:else}
									{breadcrumbItem.name}
								{/if}
							</Breadcrumb.Item>

							{#if index !== appState.breadcrumbItems.length - 1}
								<Breadcrumb.Separator />
							{/if}
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>

				<div class="relative ml-auto flex-1 md:grow-0">
					<!-- 
					<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search..."
						class="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
					/> 
					-->
				</div>
				<DarkModeSwitchButton />
				<!-- <LanguageSwitchButton /> -->
				<!-- <DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							variant="outline"
							size="icon"
							class="overflow-hidden rounded-full"
						>
							<img
								src={`/${BASE_PATH}/logo.png`}
								width={36}
								height={36}
								alt="Avatar"
								class="overflow-hidden rounded-full"
							/>
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Label>My Account</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>Settings</DropdownMenu.Item>
						<DropdownMenu.Item>Support</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>Logout</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root> -->
			</header>
			<main
				class={!appState.isSubSection
					? 'grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'
					: 'sub-section-content relative bg-accent'}
			>
				{@render children()}
			</main>
		</div>
	</div>
	<script async src={`https://www.googletagmanager.com/gtag/js?id=G-59JQDQSWTG`}>
	</script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag() {
			dataLayer.push(arguments);
		}
		gtag('js', new Date());

		gtag('config', 'G-59JQDQSWTG');
	</script>
</ParaglideJS>

<style>
	.sub-section-content {
		height: calc(100dvh - 3.5rem);
		overflow: hidden;
	}
</style>
