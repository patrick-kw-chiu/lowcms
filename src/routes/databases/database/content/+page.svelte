<script lang="ts">
	// Libraries
	import { onDestroy } from 'svelte';
	import { liveQuery, type Subscription } from 'dexie';
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { languageTag } from '$lib/paraglide/runtime.js';

	// Libraries - shadcn
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Table from '$lib/components/ui/table';
	import * as Resizable from '$lib/components/ui/resizable';
	import { toast } from 'svelte-sonner';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Accordion from '$lib/components/ui/accordion';

	// Libraries - lucide
	import CirclePlus from 'lucide-svelte/icons/circle-plus';

	// Utilities
	import { cap, getQueryString, getValueByJsonPaths } from '$lib/utilities/utilities.svelte';

	// Types
	import type { JSONSchema7 } from 'json-schema';
	import type { Selected } from 'bits-ui';
	import { type Content, type JSONObject } from '$lib/types/types.svelte';

	// IndexedDB
	import {
		db,
		deleteDatabaseConfigById,
		getDatabaseConfigById,
		getSchemaById
	} from '$lib/db/db.js';

	// Constants and locales
	import { BASE_PATH, CONTENT_TYPES, DATABASE_SECTIONS } from '$lib/constants/constants.svelte';
	import * as m from '$lib/paraglide/messages.js';

	// Components
	import StorageOption from '$lib/components/app/tag/storage-option/storage-option.svelte';
	import DeleteDbConfigDialog from '$lib/components/app/dialog/delete-db-config-dialog/delete-db-config-dialog.svelte';
	import AddDbConfigDialog from '$lib/components/app/dialog/add-db-config-dialog/add-db-config-dialog.svelte';
	import RemovableSelect from '$lib/components/app/removable-select/removable-select.svelte';
	import ContentButton from '$lib/components/app/button/content-button.svelte';
	import ContentTable from '$lib/components/app/content-table/content-table.svelte';
	import ContentEditor from '$lib/components/app/editor/content-editor/content-editor.svelte';
	import Settings from 'lucide-svelte/icons/settings';
	import Input from '$lib/components/ui/input/input.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Hr from '$lib/components/app/hr.svelte';
	import DocumentEditor from '$lib/components/app/editor/document-editor/document-editor.svelte';

	const { data } = $props();
	const { databaseId, contentId, viewDocumentAs, databaseConfig, contents, schemas } =
		$derived(data);

	let contentType = $state('all');
	let filteredContents = $derived(
		contents.filter((content) => {
			return contentType === 'all' || content.type === contentType;
		})
	);

	let uiState = $state<'initializing' | 'loading' | 'success'>('initializing');
	let selectedContents = $state<Content[]>([]);
	let contentJson = $state<JSONObject[]>([]);
	let schema = $state<JSONSchema7 | null>();

	let contentAccordionValue = $state<string>();

	const resetState = () => {
		selectedContents = [];
		contentJson = [];
		schema = null;
		uiState = 'initializing';
	};

	$effect(() => {
		if (contentId) {
			const content = contents.find((content) => content.id === contentId);
			if (content) {
				uiState = 'loading';
				loadContentAndSchema(content);
			} else {
				resetState();
			}
		} else {
			resetState();
		}
	});

	const loadContentAndSchema = async (selectedContent: Content) => {
		console.log({ viewDocumentAs, selectedContent: $state.snapshot(selectedContent) });
		const _schema = await getSchemaById(selectedContent.schemaId);
		if (_schema) {
			schema = _schema;
		}

		try {
			if (viewDocumentAs === 'documentsGroup') {
				const _selectedContents = [
					selectedContent,
					...contents.filter(
						(content) =>
							content.id !== selectedContent.id && content.schemaId === selectedContent.schemaId
					)
				];

				const contentInFiles = await Promise.all(
					_selectedContents.map(async (content) => {
						const file = await content.fileHandle!.getFile();
						const contentInFile = await file.text();
						console.log({ contentInFile });
						return contentInFile;
					})
				);

				contentJson = [];
				selectedContents = [];
				for (let i = 0; i < contentInFiles.length; i++) {
					const contentInFile = contentInFiles[i];
					const content = _selectedContents[i];
					try {
						const _contentJsonInFile = JSON.parse(contentInFile);
						const _contentJsonInFileOfJsonField = content.jsonPath
							? getValueByJsonPaths(_contentJsonInFile, content.jsonPath.split('.'))
							: _contentJsonInFile;

						contentJson = [...(contentJson as any[]), _contentJsonInFileOfJsonField];
						selectedContents = [...selectedContents, content];
					} catch (e) {
						toast.warning(`Invalid JSON: ${content.name}`, {
							position: 'top-center',
							description: (e as Error).toString()
						});
						console.log(e);
					}
				}

				console.log({
					selectedContent,
					selectedContents: $state.snapshot(selectedContents),
					_schema,
					contentInFiles
				});
			} else {
				contentJson = [];
				selectedContents = [selectedContent];

				const file = await selectedContent.fileHandle!.getFile();
				const contentInFile = await file.text();

				try {
					const _contentJsonInFile = JSON.parse(contentInFile);
					const _contentJsonInFileOfJsonField = selectedContent.jsonPath
						? getValueByJsonPaths(_contentJsonInFile, selectedContent.jsonPath.split('.'))
						: _contentJsonInFile;
					contentJson = _contentJsonInFileOfJsonField;
				} catch (e) {
					toast.warning('Invalid JSON', {
						position: 'top-center',
						description: (e as Error).toString()
					});
					console.log(e);
				}
			}
			uiState = 'success';
		} catch (e) {
			toast.warning('', {
				position: 'top-center',
				description: (e as Error).toString()
			});
			console.log(e);
		}
	};

	/**
	 * Update query params, which triggers `loadContentAndSchema`
	 * @param content
	 * @param viewDocumentAs
	 */
	const onContentClick = (content: Content, viewDocumentAs?: 'document' | 'documentsGroup') => {
		contentAccordionValue = '';
		const urlParams = new URLSearchParams(window.location.search);
		const _databaseId = urlParams.get('databaseId');
		const _contentId = urlParams.get('contentId');
		const _viewDocumentAs = urlParams.get('viewDocumentAs');

		if (
			_databaseId !== databaseId ||
			_contentId !== content.id ||
			_viewDocumentAs !== viewDocumentAs
		) {
			const queryString = getQueryString({
				databaseId,
				contentId: content.id,
				viewDocumentAs
			});
			goto(window.location.pathname + queryString);
		}
	};

	const onUpdateSuccess = () => {
		invalidateAll();
	};

	let isContentEditorOpen = $state(false);
</script>

<svelte:head>
	<title>Content | LowCMS</title>
	<meta name="description" content="Manage your local files content with LowCMS." />
</svelte:head>
<div class="flex h-full">
	<Toaster richColors />
	<Resizable.PaneGroup direction="horizontal" class="directory-viewer" style="height: 100dvh">
		<Resizable.Pane defaultSize={20}>
			<div class="lc-long-content gap-1 p-2 py-3" style="height: calc(100% - 3.5rem)">
				<a href={`/${BASE_PATH}/databases/database/content/add?databaseId=${databaseId}`}>
					<Button size="sm" class="h-8 w-full gap-1">
						<CirclePlus class="h-3.5 w-3.5" />
						<span>
							{cap(
								m.add_x({
									x: m.content()
								})
							)}
						</span>
					</Button>
				</a>
				<hr />
				<hr />
				<RemovableSelect
					options={CONTENT_TYPES.map((contentType) => ({
						value: contentType,
						label: cap(m[contentType]())
					}))}
					onSelectedChange={(item) => {
						// TODO: Should use two-way binding, but library's type seems incorrect
						const { value } = item as Selected<string>;
						contentType = value;
					}}
					placeholder={cap(m.all())}
				/>
				<hr />
				{#each filteredContents as content}
					<ContentButton
						{content}
						{schemas}
						onclick={(viewDocumentAs?: 'document' | 'documentsGroup') => {
							onContentClick(content, viewDocumentAs);
						}}
					/>
				{/each}
			</div>
		</Resizable.Pane>
		<Resizable.Handle class="w-[0.25rem] border border-accent bg-background" />
		<Resizable.Pane defaultSize={80}>
			{#if !contentId}
				<div class="flex h-full items-center justify-center">
					{cap(m.please_select_x({ x: m.content() }))}
				</div>
			{:else if !contentJson || contentJson.length === 0}
				<div class="flex h-full items-center justify-center px-16">
					<!-- TODO locales -->
					{#if uiState === 'loading'}
						Loading content...
					{:else}
						Content not found. It could be because the file path is pointing to a file that is
						removed from your desk. Please remove and add the content again.
					{/if}
				</div>
			{:else if !schema}
				<div class="flex h-full items-center justify-center px-16">
					<!-- TODO locales -->
					Schema not found for this content. It could be because the schema is being removed unexpectedly.
					To resolve the issue, please "edit content" and assign a schema to it.
				</div>
			{:else}
				<div class="lc-long-content gap-4 px-6" style="height: calc(100% - 3.5rem)">
					<div class="flex items-start justify-between">
						<Accordion.Root bind:value={contentAccordionValue} style="width: calc(100% - 36px)">
							<Accordion.Item value="content-accordion">
								<Accordion.Trigger>
									<div class="flex items-center gap-2">
										<h3 class="text-lg font-semibold">
											{selectedContents[0]?.name}
										</h3>
										<div
											class={`h-6 p-2 lc-badge-${!viewDocumentAs ? 'string' : viewDocumentAs === 'document' ? 'number' : 'boolean'} flex items-center justify-center rounded-lg text-sm`}
										>
											{cap(m[viewDocumentAs ?? 'collection']())}
										</div>
									</div>
								</Accordion.Trigger>
								<Accordion.Content class="flex flex-col gap-4 text-balance">
									<div class="relative flex flex-col gap-2">
										<div class="flex items-center gap-2">
											<span
												class="text-muted-foreground"
												style={languageTag() === 'en' ? '' : 'min-width: 40px'}
											>
												{cap(m.name())}:
											</span>
											<Input
												disabled
												value={selectedContents[0]?.name}
												class="!cursor-default !opacity-90"
											/>
											<span
												class="text-muted-foreground"
												style={languageTag() === 'en' ? 'min-width: 90px' : 'min-width: 62px'}
											>
												{cap(m.content_type())}:
											</span>
											<Input
												disabled
												value={cap(m[selectedContents[0]?.type as 'document' | 'collection']?.())}
												class="size-fit !cursor-default !opacity-90"
											/>
										</div>
										{#if selectedContents[0]?.description}
											<div class="flex gap-2">
												<span
													class="text-muted-foreground"
													style={languageTag() === 'en' ? '' : 'min-width: 40px'}
												>
													{cap(m.description())}:
												</span>
												<Textarea
													disabled
													value={selectedContents[0]?.description}
													class="!cursor-default !opacity-90"
													style="resize: none"
												/>
											</div>
										{/if}
									</div>
								</Accordion.Content>
							</Accordion.Item>
						</Accordion.Root>
						<Sheet.Root bind:open={isContentEditorOpen}>
							<Sheet.Trigger><Settings class="mt-4" /></Sheet.Trigger>
							<Sheet.Content class="w-[520px] p-3 py-6" style="max-width: 520px !important">
								<ContentEditor
									{contentId}
									contentName={selectedContents[0]?.name}
									contentDescription={selectedContents[0]?.description}
									contentIn={selectedContents[0]?.contentIn}
									contentJsonInFileType={selectedContents[0]?.contentJsonInFileType}
									contentFilePath={selectedContents[0]?.filePath}
									directoryHandleName={databaseConfig?.directoryHandle?.name!}
									contentJsonPaths={(selectedContents[0]?.jsonPath ?? '').split('.')}
									contentDataType={selectedContents[0]?.type === 'collection'
										? 'array-of-objects'
										: 'object'}
									onUpdateSuccess={() => {
										isContentEditorOpen = false;
									}}
									{schemas}
									schemaId={selectedContents[0]?.schemaId}
								/>
							</Sheet.Content>
						</Sheet.Root>
					</div>
					{#if contentAccordionValue}<Hr class="mb-0" />{/if}
					{#if viewDocumentAs === 'documentsGroup' || selectedContents[0]?.type === 'collection'}
						<ContentTable
							rows={contentJson}
							{schema}
							{selectedContents}
							contentType={selectedContents[0]?.type === 'collection' ? 'collection' : 'document'}
						/>
					{:else if viewDocumentAs === 'document'}
						<DocumentEditor
							{viewDocumentAs}
							contentType="document"
							{selectedContents}
							rows={[contentJson]}
							{schema}
							checkedRowIndexes={[0]}
							{onUpdateSuccess}
						/>
					{/if}
				</div>
			{/if}
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
