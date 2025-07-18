<script lang="ts">
	// Libraries
	import { onDestroy } from 'svelte';
	import { liveQuery, type Subscription } from 'dexie';
	import { page } from '$app/state';
	import { nanoid } from 'nanoid';

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
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Input } from '$lib/components/ui/input';

	import * as Accordion from '$lib/components/ui/accordion';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	import * as Alert from '$lib/components/ui/alert';

	// Libraries - lucide
	import Boxes from 'lucide-svelte/icons/boxes';
	import FileText from 'lucide-svelte/icons/file-text';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import CircleHelp from 'lucide-svelte/icons/circle-help';
	import FileWarning from 'lucide-svelte/icons/file-warning';

	// Utilities
	import {
		cap,
		deriveJSONSchema,
		getValueByJsonPaths,
		getLowCMSTypeByValue,
		removeFileExtension,
		hasXTypes
	} from '$lib/utilities/utilities.svelte';

	// Types
	import type { JSONSchema7 } from 'json-schema';
	import {
		type ContentDataType,
		type ContentType,
		type JSONObject,
		type JSONSchema7WithUnknown
	} from '$lib/types/types.svelte';
	import type { Selected } from 'bits-ui';

	// IndexedDB
	import {
		createContent,
		createSchema,
		db,
		deleteDatabaseConfigById,
		getDatabaseConfigById
	} from '$lib/db/db.js';

	// Constants and locales
	import {
		BASE_PATH,
		BASE_SCHEMA,
		CONTENT_TYPES,
		DATABASE_SECTIONS
	} from '$lib/constants/constants.svelte';
	import * as m from '$lib/paraglide/messages.js';

	// Components
	import DirectoryTree from '$lib/components/app/directory-tree/directory-tree.svelte';
	import JsonFieldSelector from '$lib/components/app/json-field-selector/json-field-selector.svelte';
	import SchemaEditor from '$lib/components/app/editor/schema-editor/schema-editor.svelte';
	import RemovableSelect from '$lib/components/app/removable-select/removable-select.svelte';
	import Hr from '$lib/components/app/hr.svelte';
	import ContentEditor from '$lib/components/app/editor/content-editor/content-editor.svelte';
	import Braces from 'lucide-svelte/icons/braces';

	let { data } = $props();
	let { loadingState, databaseConfig, isPermitted, contents, schemas } = $derived(data);

	// Content
	let fileHandle = $state<FileSystemFileHandle>();
	let contentJsonInFile = $state<JSONObject | JSONObject[]>();
	let contentJsonInFileType = $state<ContentDataType>();
	let contentFilePath = $state('');
	let contentName = $state('');
	let contentDescription = $state('');
	let contentIn = $state<'entire-file' | 'specific-field' | undefined>('entire-file');
	let contentJsonPaths = $state<string[]>([]);
	let content = $state<JSONObject | JSONObject[]>();
	let contentDataType = $state<ContentDataType | undefined>();

	// Schema
	let existingSchemaId = $state<string>();
	/**
	 * Initial schema derived by contentJsonInFile.
	 * This is for resetting schema when removing existingSchemaId
	 */
	let initialSchema = $state<JSONSchema7>(BASE_SCHEMA);
	let schema = $state<JSONSchema7>(BASE_SCHEMA);

	/**
	 * Whether essential fields are filled
	 */
	let canCreateTooltip = $derived(
		cap(
			!Boolean(fileHandle)
				? m.add_content_tooltip_1()
				: !(contentIn === 'entire-file' || contentJsonPaths.length > 0)
					? m.add_content_tooltip_2()
					: !Boolean(contentName)
						? m.enter_the_x({ x: m.content_name() })
						: !Boolean(schema.title)
							? m.enter_the_x({ x: m.schema_title() })
							: hasXTypes(schema as JSONSchema7WithUnknown, ['unknown', 'null', 'array-empty'])
								? // TODO locales
									'Schema contains property(s) with the "unknown" type. Please assign a type to this property.'
								: ''
		)
	);

	const resetSchemaState = () => {
		existingSchemaId = undefined;
		initialSchema = BASE_SCHEMA;
		schema = BASE_SCHEMA;
	};

	const resetState = () => {
		fileHandle = undefined;
		contentJsonInFile = undefined;
		contentFilePath = '';
		contentIn = 'entire-file';
		contentJsonPaths = [];
		content = undefined;
		contentDataType = undefined;

		resetSchemaState();
	};

	const onFileHandleSelect = async (selectedFileHandle: FileSystemFileHandle) => {
		resetState();
		const file = await selectedFileHandle.getFile();
		const contentInFile = await file.text();

		try {
			const _contentJsonInFile = JSON.parse(contentInFile);
			const _contentJsonInFileType = getLowCMSTypeByValue(_contentJsonInFile) as ContentDataType;
			if (!['array-of-objects', 'object'].includes(_contentJsonInFileType)) {
				toast.warning('Unsupported JSON', {
					position: 'top-center',
					// TODO locales
					description:
						'Only collection (array of objects) or document (object) are supported currently.'
				});
				return;
			}

			contentJsonInFile = _contentJsonInFile;
			contentJsonInFileType = _contentJsonInFileType;
			contentFilePath = (await data.databaseConfig!.directoryHandle!.resolve(
				selectedFileHandle
			))!.join('/');
			fileHandle = selectedFileHandle;
			contentDataType = getLowCMSTypeByValue(contentJsonInFile) as ContentDataType;
			schema = {
				...deriveJSONSchema($state.snapshot(contentJsonInFile!)),
				title: removeFileExtension(file.name)
			};
			initialSchema = schema;
		} catch (e) {
			toast.warning(`"${file.name}" is an invalid JSON`, {
				position: 'top-center',
				description: (e as Error).toString()
			});
			console.log(e);
		}
	};

	const onContentInSelect = (value: 'entire-file' | 'specific-field') => {
		contentIn = value;
		contentJsonPaths = [];
		if (value === 'entire-file') {
			schema = {
				...deriveJSONSchema($state.snapshot(contentJsonInFile!)),
				title: removeFileExtension(fileHandle!.name)
			};
			initialSchema = schema;
		}
	};

	const onJsonPathsSelect = (paths: string[]) => {
		console.log({ paths });
		contentJsonPaths = paths;
		content = getValueByJsonPaths(contentJsonInFile!, paths);
		contentDataType = getLowCMSTypeByValue(content) as ContentDataType;
		schema = {
			...deriveJSONSchema($state.snapshot(content!)),
			title: paths[paths.length - 1]
		};
		initialSchema = schema;
	};

	const promptConfirmation = () => {
		if (
			window.confirm(
				m.add_content_confirmation({
					x: contentName,
					y: schema.title!
				})
			)
		) {
			createContentAndSchema();
		}
	};

	/**
	 * Create content and schema (if any)
	 * If an existing schema is selected (existingSchemaId is not undefined), associate it to the content
	 * If no schema is selected, create a new schema, associate it to the content
	 */
	const createContentAndSchema = async () => {
		console.log({
			fileHandle,
			contentJsonInFile: $state.snapshot(contentJsonInFile),
			contentJsonInFileType,
			contentFilePath,
			contentName,
			contentDescription,
			contentIn,
			contentJsonPaths: $state.snapshot(contentJsonPaths),
			content,
			contentDataType,
			//
			existingSchemaId,
			schema: $state.snapshot(schema)
		});

		let schemaId;
		if (!existingSchemaId) {
			const schemaToAdd = {
				// ...schema,
				...$state.snapshot(schema),
				id: nanoid(32),
				description: schema.description || '',
				tags: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};
			console.log({ schemaToAdd });
			schemaId = await createSchema(schemaToAdd);
		}

		console.log({ schemaId });

		const contentToAdd = {
			id: nanoid(32),
			name: contentName,
			description: contentDescription,
			tags: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			//
			schemaId: schemaId ?? existingSchemaId ?? '',
			databaseId: page.data.databaseId,
			type: (contentDataType === 'array-of-objects' ? 'collection' : 'document') as Omit<
				ContentType,
				'all'
			>,
			filePath: contentFilePath,
			fileType: 'json',
			jsonPath: contentJsonPaths.join('.'),
			fileHandle,
			contentIn,
			contentJsonInFileType
		};
		console.log({ contentToAdd });
		await createContent(contentToAdd);
		window.location.href =
			`/${BASE_PATH}/databases/database/content` +
			`?databaseId=${page.data.databaseId}&contentId=${contentToAdd.id}` +
			(contentDataType === 'array-of-objects' ? '' : '&viewDocumentAs=document');
	};
</script>

<svelte:head>
	<title>Add Content | LowCMS</title>
	<meta name="description" content="Configure a content to be managed by LowCMS." />
</svelte:head>
<div class="flex h-full">
	<Toaster richColors />
	<div class="flex h-14 w-full items-center gap-2 border-b-4 border-b-background px-4">
		<div class="flex h-14 w-full items-center gap-2">
			{cap(m.add_x({ x: m.content() }))}
			<ChevronRight class="h-4 w-4" />
			{#if !fileHandle}
				1. {m.add_content_tooltip_1()}
			{:else if !(contentIn === 'entire-file' || contentJsonPaths.length > 0)}
				2. {m.add_content_tooltip_2()}
			{:else}
				3. {m.add_content_tooltip_3()}
			{/if}
			<Tooltip.Root>
				<Tooltip.Trigger><CircleHelp /></Tooltip.Trigger>
				<Tooltip.Content>
					<ol>
						<li>1. {m.add_content_tooltip_1()}</li>
						<li>2. {m.add_content_tooltip_2()}</li>
						<li>3. {m.add_content_tooltip_3()}</li>
					</ol>
				</Tooltip.Content>
			</Tooltip.Root>
		</div>
		{#if !Boolean(canCreateTooltip)}
			<Button size="sm" class="h-8 gap-1" onclick={promptConfirmation}>
				<CirclePlus class="h-3.5 w-3.5" />
				{cap(m.add_x({ x: m.content() }))}
			</Button>
		{:else}
			<Tooltip.Root>
				<Tooltip.Trigger class="flex items-center gap-2">
					<Button size="sm" class="h-8 gap-1" disabled>
						<CirclePlus class="h-3.5 w-3.5" />
						{cap(m.add_x({ x: m.content() }))}
					</Button>
					<CircleHelp />
				</Tooltip.Trigger>
				<Tooltip.Content side="bottom">{canCreateTooltip}</Tooltip.Content>
			</Tooltip.Root>
		{/if}
	</div>
	<Resizable.PaneGroup
		direction="horizontal"
		class="directory-viewer absolute inset-y-14"
		style="height: calc(100dvh - 3rem)"
	>
		<Resizable.Pane defaultSize={20}>
			<div class="lc-long-content font-mono">
				{#if data.databaseConfig?.directoryHandle}
					<DirectoryTree
						directoryHandle={data.databaseConfig.directoryHandle}
						open={true}
						onselect={onFileHandleSelect}
					/>
				{/if}
			</div>
		</Resizable.Pane>
		<Resizable.Handle class="w-[0.25rem] border border-accent bg-background" />
		<Resizable.Pane defaultSize={48}>
			{#if contentJsonInFile}
				<ContentEditor
					bind:contentName
					bind:contentDescription
					bind:contentIn
					{onContentInSelect}
					{onJsonPathsSelect}
					{contentJsonInFileType}
					{contentFilePath}
					directoryHandleName={data.databaseConfig!.directoryHandle!.name}
					{contentDataType}
					{contentJsonPaths}
					{contentJsonInFile}
				/>
			{:else}
				<div class="flex h-full items-center justify-center p-8">
					{cap(m.add_content_tooltip_1())}
				</div>
			{/if}
		</Resizable.Pane>
		<Resizable.Handle class="w-[0.25rem] border border-accent bg-background" />
		<Resizable.Pane defaultSize={32}>
			{#if contentJsonInFile}
				{#if !!schema && (contentIn === 'entire-file' || contentJsonPaths.length > 0)}
					<div class="lc-long-content w-full p-4" style="height: calc(100% - 3.5rem)">
						<h4 class="mb-4 scroll-m-20 text-xl font-semibold tracking-tight">
							<span class="flex items-center gap-2">
								<Braces />
								{cap(m.schema())}
							</span>
							{#if contentDataType === 'array-of-objects'}
								<p class="mt-1 text-xs opacity-60">{m.schema_of()}</p>
							{/if}
						</h4>
						<RemovableSelect
							options={schemas.map((schema) => ({ label: schema.title!, value: schema.id! }))}
							value={existingSchemaId}
							placeholder={cap(m.select_existing_x({ x: m.schema() }))}
							onSelectedChange={(item) => {
								// TODO: Should use two-way binding, but library's type seems incorrect
								const { value } = item as Selected<string>;
								console.log({ item });
								existingSchemaId = value;
								schema = schemas.find((schema) => schema.id === value)!;
							}}
							disabled={!existingSchemaId}
							onRemove={() => {
								existingSchemaId = undefined;
								schema = initialSchema;
							}}
						/>
						<div class="flex w-full flex-col gap-2 py-4">
							<Label for="title">{cap(m.title())}</Label>
							<Input
								id="title"
								bind:value={() => schema.title, (value) => (schema.title = value)}
								disabled={!!existingSchemaId}
							/>
							<Label for="description">{cap(m.description())}</Label>
							<Input
								id="description"
								bind:value={() => schema.description, (value) => (schema.description = value)}
								disabled={!!existingSchemaId}
							/>
						</div>
						<div
							class={`relative mb-2 whitespace-break-spaces rounded-xl bg-background p-4 font-mono text-xs`}
						>
							<SchemaEditor
								bind:jsonSchema={schema.properties!}
								isRoot={true}
								disabled={Boolean(existingSchemaId)}
							/>
						</div>
					</div>
				{:else}
					<div class="flex h-full items-center justify-center p-8">
						{cap(m.add_content_tooltip_2())}
					</div>
				{/if}
			{/if}
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
