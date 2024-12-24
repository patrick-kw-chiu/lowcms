<!--
@component
- Edit content configs
-->

<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	// Libraries - shadcn
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import * as Alert from '$lib/components/ui/alert';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { toast } from 'svelte-sonner';
	import { Toggle } from '$lib/components/ui/toggle';

	// Libraries - lucide
	import Boxes from 'lucide-svelte/icons/boxes';
	import FileText from 'lucide-svelte/icons/file-text';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Key from 'lucide-svelte/icons/key';
	import File from 'lucide-svelte/icons/file';
	import CircleHelp from 'lucide-svelte/icons/circle-help';
	import FileWarning from 'lucide-svelte/icons/file-warning';

	// Types
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	import type { ContentDataType, JSONObject, Schema } from '$lib/types/types.svelte';
	import type { Selected } from 'bits-ui';

	// IndexedDB
	import { updateContent } from '$lib/db/db';

	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';

	// Components
	import Hr from '$lib/components/app/hr.svelte';
	import JsonFieldSelector from '$lib/components/app/json-field-selector/json-field-selector.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import RemovableSelect from '../../removable-select/removable-select.svelte';
	import SchemaEditor from '../schema-editor/schema-editor.svelte';
	import Braces from 'lucide-svelte/icons/braces';

	interface Props {
		contentId?: string;
		contentName: string;
		contentDescription: string;
		contentIn: 'entire-file' | 'specific-field' | undefined;
		onContentInSelect?: (value: 'entire-file' | 'specific-field') => void;
		onJsonPathsSelect?: (value: string[]) => void;
		contentJsonInFileType?: 'object' | 'array-of-objects';
		contentFilePath: string;
		directoryHandleName: string;
		contentJsonPaths: string[];
		contentDataType?: ContentDataType;
		contentJsonInFile?: JSONObject;
		//
		onUpdateSuccess?: () => void;
		schemas?: Schema[];
		schemaId?: string;
	}
	let {
		contentId,
		contentName = $bindable(),
		contentDescription = $bindable(),
		contentIn = $bindable(),
		onContentInSelect,
		onJsonPathsSelect,
		contentJsonInFileType,
		contentFilePath,
		directoryHandleName,
		contentJsonPaths,
		contentDataType,
		contentJsonInFile,
		onUpdateSuccess,
		schemas,
		schemaId = $bindable()
	}: Props = $props();
	let isEditExistingContent = $derived(Boolean(contentId));
	let originalContentName = $state(contentName);
	let originalContentDescription = $state(contentDescription);
	let originalSchemaId = $state(schemaId);
	let showSchemaPreview = $state(true);

	let hasContentChanged = $derived(
		originalContentName !== contentName ||
			originalContentDescription !== contentDescription ||
			originalSchemaId !== schemaId
	);

	const handleUpdateContent = async () => {
		const isUpdated = await updateContent(contentId!, {
			name: contentName,
			description: contentDescription,
			schemaId
		});
		if (isUpdated) {
			invalidateAll();
			onUpdateSuccess?.();
		} else {
			// TODO locales
			toast.error('Failed to update content');
		}
	};
</script>

<div
	class="lc-long-content p-4"
	style={`height: ${isEditExistingContent ? '100%' : 'calc(100% - 3.5rem)'}`}
>
	{#if isEditExistingContent}
		<Alert.Root class="mb-4">
			<FileWarning class="h-4 w-4" />
			<Alert.Title>
				<!-- TODO locales -->
				You can edit the content's name, description and the associated schema.
			</Alert.Title>
		</Alert.Root>
	{/if}
	<h4 class="mb-4 scroll-m-20 text-xl font-semibold tracking-tight">
		<span class="flex items-center gap-2">
			<FileText />
			{cap(m.content())}
		</span>
	</h4>
	<div class="flex w-full flex-col gap-2 py-4">
		<Label for="content-name">{cap(m.name())}</Label>
		<Input id="content-name" bind:value={contentName} />
		<Label for="content-description">{cap(m.description())}</Label>
		<Textarea id="content-description" bind:value={contentDescription} />
	</div>
	<Hr />
	{#if !isEditExistingContent && contentJsonInFileType === 'array-of-objects'}
		<Alert.Root class="mb-4">
			<FileWarning class="h-4 w-4" />
			<Alert.Title>
				{cap(m.alert_array_file_only({ x: m.content_in_entire_file() }))}
			</Alert.Title>
		</Alert.Root>
	{/if}
	{#if onContentInSelect}
		<RadioGroup.Root bind:value={() => contentIn!, onContentInSelect!} class="pb-4">
			<div class="flex items-center space-x-2">
				<RadioGroup.Item value="entire-file" id="entire-file" />
				<Label for="entire-file" class="flex items-center gap-1">
					<File />{cap(m.content_in_entire_file())}
				</Label>
			</div>
			<div
				class={`flex items-center space-x-2 ${contentJsonInFileType === 'array-of-objects' ? 'opacity-50' : ''}`}
			>
				<RadioGroup.Item
					value="specific-field"
					id="specific-field"
					disabled={contentJsonInFileType === 'array-of-objects'}
				/>
				<Label for="specific-field" class="flex items-center gap-1">
					<Key />{cap(m.content_in_specific_field())}
				</Label>
			</div>
		</RadioGroup.Root>
	{:else}
		<div class="flex items-center gap-2">
			{#if contentIn === 'entire-file'}
				<File />{cap(m.content_in_entire_file())}
			{:else}
				<Key />{cap(m.content_in_specific_field())}
			{/if}
		</div>
	{/if}
	<div class="flex w-full flex-col gap-2 py-4">
		<Label for="content-path">{cap(m.file_path())}</Label>
		<Input
			id="content-path"
			disabled
			class="disabled:cursor-text"
			value={`${directoryHandleName}/${contentFilePath}`}
		/>
		{#if contentIn === 'specific-field'}
			<Label for="content-json-paths">{m.jsonPath()}</Label>
			<Input
				id="content-json-paths"
				disabled
				class="disabled:cursor-text"
				value={contentJsonPaths.join('.') || `<${m.add_content_tooltip_2()}>`}
			/>
		{/if}
		<Label for="content-type" class="flex items-center gap-2">
			{cap(m.content_type())}
			<Tooltip.Root>
				<Tooltip.Trigger><CircleHelp /></Tooltip.Trigger>
				<Tooltip.Content>
					{@html m.content_type_description()}
				</Tooltip.Content>
			</Tooltip.Root>
		</Label>
		<Input
			id="content-type"
			disabled
			class="disabled:cursor-text"
			value={cap(contentDataType === 'array-of-objects' ? m.collection() : m.document())}
		/>
	</div>
	{#if contentJsonInFile}
		<div
			class={`relative mb-2 whitespace-break-spaces rounded-xl bg-background p-4 font-mono text-xs ${contentIn === 'entire-file' ? 'opacity-70' : ''}`}
		>
			{#if contentJsonInFileType === 'object'}
				<JsonFieldSelector
					json={contentJsonInFile}
					disabled={contentIn === 'entire-file'}
					onselect={onJsonPathsSelect!}
				/>
				{#if contentIn === 'entire-file'}
					<div class="absolute left-0 top-0 h-full w-full backdrop-blur-[1px]"></div>
				{/if}
			{:else}
				{JSON.stringify(contentJsonInFile, null, 2)}
			{/if}
		</div>
	{/if}
	{#if isEditExistingContent}
		{#if schemas}
			<div class="flex items-center gap-2">
				<RemovableSelect
					label={cap(m.select_existing_x({ x: m.schema() }))}
					options={schemas.map((schema) => ({ label: schema.title!, value: schema.id! }))}
					value={schemaId}
					placeholder={cap(m.select_existing_x({ x: m.schema() }))}
					onSelectedChange={(item) => {
						// TODO: Should use two-way binding, but library's type seems incorrect
						const { value } = item as Selected<string>;
						console.log({ item });
						schemaId = value;
					}}
				/>
				<Toggle
					aria-label="Toggle type label"
					pressed={showSchemaPreview}
					onPressedChange={(pressed) => {
						// TODO locales
						toast.info(`${pressed ? 'Show' : 'Hide'} schema preview`, {
							position: 'top-center',
							duration: 1500
						});
						showSchemaPreview = pressed;
					}}
					class="w-fit"
					style="transform: translateY(0.6rem)"
				>
					<Braces class="h-4 w-4" />
				</Toggle>
			</div>
		{/if}
		{#if schemas?.find((s) => s.id === schemaId) && showSchemaPreview}
			<div class="mt-2 rounded-md bg-accent p-4 text-xs">
				<SchemaEditor
					disabled={true}
					jsonSchema={schemas.find((s) => s.id === schemaId)!.properties!}
				/>
			</div>
		{/if}
		<Button class="mt-4" disabled={!hasContentChanged} onclick={handleUpdateContent}>
			{cap(m.edit_x({ x: m.content() }))}
		</Button>
	{/if}
</div>
