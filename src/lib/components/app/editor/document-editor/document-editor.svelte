<!--
@component
It could edit a single `document` or document inside a `collection`.
-->

<script lang="ts">
	import { codeToHtml } from 'shiki';
	import { mode } from 'mode-watcher';
	import { v4 as uuidv4 } from 'uuid';
	import { nanoid } from 'nanoid';

	// Libraries - shadcn
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { toast } from 'svelte-sonner';
	import { Toggle } from '$lib/components/ui/toggle';

	// Libraries - lucide
	import X from 'lucide-svelte/icons/x';
	import Type from 'lucide-svelte/icons/type';

	// Types
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	import type { Content, JSONObject, JSONSchema7WithCustomKeyword } from '$lib/types/types.svelte';
	import type { Selected } from 'bits-ui';

	// IndexedDB
	import { updateContent } from '$lib/db/db';

	// Utilities
	import {
		cap,
		extractWhitespaceParts,
		getValueByJsonPaths,
		setValueByJsonPathsMutable,
		getLabelFor
	} from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';

	// Components
	import Hr from '$lib/components/app/hr.svelte';
	import JsonFieldSelector from '$lib/components/app/json-field-selector/json-field-selector.svelte';
	import TypeLabel from '../../label/type-label.svelte';
	import ArrayEditor from './array-editor.svelte';
	import Braces from 'lucide-svelte/icons/braces';
	import RemovableSelect from '../../removable-select/removable-select.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';

	interface Props {
		contentType: 'document' | 'collection';
		viewDocumentAs?: 'document';
		selectedContents?: Content[];
		rows: JSONObject[];
		schema: JSONSchema7;
		checkedRowIndexes: number[];
		onUpdateSuccess?: () => void;
	}
	let {
		contentType,
		viewDocumentAs,
		selectedContents,
		rows,
		schema,
		checkedRowIndexes,
		onUpdateSuccess
	}: Props = $props();
	let isObjectInArray = $derived(!Boolean(selectedContents));
	let checkedRowIndex = $derived(checkedRowIndexes[0]);
	let selectedContent = $derived(
		isObjectInArray
			? undefined
			: contentType === 'document'
				? selectedContents?.[checkedRowIndex]
				: selectedContents?.[0]
	);

	let rawData = $state<JSONObject>(rows[checkedRowIndex] ?? {});
	let editedData = $state<JSONObject>($state.snapshot(rawData));

	// State
	let hasContentChanged = $state(false);
	let jsonHTML = $state('');
	let showTypeLabel = $state(false);

	// State - ID - nanoid
	let lengthOfNanoid = $state(32);

	const generateJsonHTML = async (editedData: JSONObject) => {
		jsonHTML =
			jsonHTML !== ''
				? await codeToHtml(JSON.stringify(editedData, null, 4), {
						lang: 'json',
						theme: `github-${mode.current}`
					})
				: '';
	};

	const handleUpdateDocument = async () => {
		console.log({
			rows: $state.snapshot(rows),
			selectedContent: $state.snapshot(selectedContent),
			checkedRowIndexes: $state.snapshot(checkedRowIndexes),
			editedData: $state.snapshot(editedData)
		});

		// 1. When it is a nested object inside an array
		if (!selectedContent) {
			rows[checkedRowIndex] = editedData;
			toast.info('Nested object updated successfully', {
				position: 'top-center',
				// TODO locales
				description: 'Please note that it is NOT saved to the file yet',
				duration: 1500
			});
			onUpdateSuccess?.();
			return;
		}

		// 2. When it is the `content` itself
		const file = await selectedContent.fileHandle!.getFile();
		const contentInFile = await file.text();
		try {
			let jsonContent: JSONObject = JSON.parse(contentInFile);
			const hasJsonPath = selectedContent.jsonPath !== '';
			console.log({ hasJsonPath });

			if (selectedContent.type === 'document') {
				if (hasJsonPath) {
					setValueByJsonPathsMutable(jsonContent, selectedContent.jsonPath!.split('.'), {
						value: editedData
					});
				} else {
					jsonContent = editedData;
				}
			} else {
				if (hasJsonPath) {
					const originalJsonWithPath = getValueByJsonPaths(
						jsonContent,
						selectedContent.jsonPath!.split('.')
					);
					const isCreate = checkedRowIndex === originalJsonWithPath.length;
					setValueByJsonPathsMutable(jsonContent, selectedContent.jsonPath!.split('.'), {
						value: isCreate
							? [...(originalJsonWithPath as []), editedData]
							: originalJsonWithPath.map((row: any, index: number) => {
									return index === checkedRowIndex ? editedData : row;
								})
					});
					console.log({
						jsonContent,
						isCreate,
						'[...(originalJsonWithPath as []), editedData]': [
							...(originalJsonWithPath as []),
							editedData
						]
					});
				} else {
					const isCreate = checkedRowIndex === jsonContent.length;
					jsonContent = isCreate
						? [...(jsonContent as []), editedData]
						: jsonContent.map((row: any, index: number) => {
								return index === checkedRowIndex ? editedData : row;
							});
				}
			}

			// Create a FileSystemWritableFileStream to write to.
			const writable = await selectedContent.fileHandle!.createWritable();
			// Write the contents of the file to the stream.
			await writable.write(JSON.stringify(jsonContent, null, 2));
			// Close the file and write the contents to disk.
			await writable.close();
			toast.success(selectedContent.name, {
				position: 'top-center',
				// TODO locales
				description: 'Saved successfully!',
				duration: 1500
			});
			onUpdateSuccess?.();
		} catch (e) {
			toast.warning(selectedContent.name, {
				position: 'top-center',
				description: (e as Error).toString()
			});
			console.log(e);
		}
	};

	$effect(() => {
		generateJsonHTML(editedData);
	});

	console.log({
		rows: $state.snapshot(rows),
		rawData: $state.snapshot(rawData),
		editedData: $state.snapshot(editedData),
		selectedContent: $state.snapshot(selectedContent),
		schema: $state.snapshot(schema)
	});
</script>

{#snippet StringEditor(jsonPaths: string[], config: JSONSchema7WithCustomKeyword)}
	{#if config.enum}
		<RemovableSelect
			options={config.enum.map((label) => ({ label, value: label })) as {
				label: string;
				value: string;
			}[]}
			onSelectedChange={(item) => {
				const { value } = item as Selected<string>;
				setValueByJsonPathsMutable(editedData, jsonPaths, { value });
			}}
			value={getValueByJsonPaths(editedData, jsonPaths) as string}
			placeholder={cap(m.select_x({ x: m.enumeration() }))}
		/>
	{:else if config.type === 'string'}
		{#if config['x-string-custom-type']}
			<div class="mb-1 flex items-center gap-2">
				<Button
					variant="secondary"
					size="sm"
					onclick={() => {
						const xCustomStringType = config['x-string-custom-type'];
						const value = xCustomStringType === 'ID - uuid' ? uuidv4() : nanoid(lengthOfNanoid);
						setValueByJsonPathsMutable(editedData, jsonPaths, { value });
					}}
				>
					Generate a new "{config['x-string-custom-type']}"
				</Button>
				{#if config['x-string-custom-type'] === 'ID - nanoid'}
					<Label for="nanoid-length">Length</Label>
					<Input id="nanoid-length" class="h-6 w-fit" type="number" bind:value={lengthOfNanoid} />
				{/if}
			</div>
		{/if}
		<Input
			id={getLabelFor(jsonPaths)}
			class={`h-8`}
			placeholder={jsonPaths[jsonPaths.length - 1]}
			bind:value={
				() => getValueByJsonPaths(editedData, jsonPaths) as string,
				(value: string) => {
					setValueByJsonPathsMutable(editedData, jsonPaths, { value });
				}
			}
		/>
	{:else}
		<Textarea
			id={getLabelFor(jsonPaths)}
			placeholder={jsonPaths[jsonPaths.length - 1]}
			bind:value={
				() => {
					let _value = getValueByJsonPaths(editedData, jsonPaths);
					try {
						_value = JSON.stringify(_value as string, null, 2);
					} catch (e) {}
					return _value;
				},
				(value: string) => {
					let _value = value;
					try {
						_value = JSON.parse(value);
					} catch (e) {}
					setValueByJsonPathsMutable(editedData, jsonPaths, { value: _value });
				}
			}
		/>
	{/if}
{/snippet}

{#snippet NumberEditor(jsonPaths: string[], config: JSONSchema7)}
	<Input
		id={getLabelFor(jsonPaths)}
		class={`h-8`}
		type="number"
		placeholder={jsonPaths[jsonPaths.length - 1]}
		bind:value={
			() => getValueByJsonPaths(editedData, jsonPaths) as string,
			(value: string) => {
				setValueByJsonPathsMutable(editedData, jsonPaths, { value });
			}
		}
	/>
{/snippet}

{#snippet BooleanEditor(jsonPaths: string[], config: JSONSchema7)}
	<div class="flex items-center space-x-2">
		<Switch
			id="airplane-mode"
			bind:checked={
				() => getValueByJsonPaths(editedData, jsonPaths) as boolean,
				(value: boolean) => {
					setValueByJsonPathsMutable(editedData, jsonPaths, { value });
				}
			}
		/>
		<Label for="airplane-mode">{getValueByJsonPaths(editedData, jsonPaths)}</Label>
	</div>
{/snippet}

{#snippet ObjectEditor(jsonPaths: string[], schema: JSONSchema7, isRoot: boolean = false)}
	<div class={`mb-2 ${isRoot ? '' : 'pl-2'}`}>
		{#each Object.entries(schema?.properties ?? {}) as [field, config]}
			<div class="mb-2 flex items-center gap-2">
				<Label
					for={getLabelFor([...jsonPaths, field])}
					class={`${false && ['object', 'array'].includes((config as JSONSchema7).type as string) ? 'opacity-50' : ''}`}
				>
					{field}
				</Label>
				{#if showTypeLabel}
					<div
						class={`lc-badge-${(config as JSONSchema7).type} inline-block h-4 rounded-xl px-2 py-0 text-xs text-white hover:bg-primary/20`}
						style="width: content-fit;"
					>
						<TypeLabel config={config as JSONSchema7} />
					</div>
				{/if}
			</div>
			<div class="mb-4">
				{#if ['string'].includes((config as JSONSchema7).type as string)}
					{@render StringEditor([...jsonPaths, field], config as JSONSchema7)}
				{:else if ['number', 'integer'].includes((config as JSONSchema7).type as string)}
					{@render NumberEditor([...jsonPaths, field], config as JSONSchema7)}
				{:else if (config as JSONSchema7).type === 'boolean'}
					{@render BooleanEditor([...jsonPaths, field], config as JSONSchema7)}
				{:else if (config as JSONSchema7).type === 'array'}
					<ArrayEditor
						config={config as JSONSchema7}
						jsonPaths={[...jsonPaths, field]}
						data={editedData}
					/>
				{:else if (config as JSONSchema7).type === 'object'}
					<div class="pl-4">
						{@render ObjectEditor([...jsonPaths, field], config as JSONSchema7)}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/snippet}

<div class="lc-long-content relative p-4 pt-0">
	<div class={`sticky top-0 z-20 bg-${viewDocumentAs === 'document' ? 'accent' : 'background'}`}>
		<div class={`flex items-center justify-end gap-2 pb-2 pr-3`}>
			<Toggle
				aria-label="Toggle JSON preview"
				pressed={jsonHTML !== ''}
				onPressedChange={async (pressed) => {
					// TODO locales
					toast.info(pressed ? 'Show JSON preview' : 'Hide JSON preview', {
						position: 'top-center',
						duration: 1500
					});
					jsonHTML = pressed
						? await codeToHtml(JSON.stringify(editedData, null, 4), {
								lang: 'json',
								theme: `github-${mode.current}`
							})
						: '';
				}}
				class="w-fit"
			>
				<Braces class="h-4 w-4" />
			</Toggle>
			<Toggle
				aria-label="Toggle type label"
				pressed={showTypeLabel}
				onPressedChange={(pressed) => {
					// TODO locales
					toast.info(pressed ? 'Show type label' : 'Hide type label', {
						position: 'top-center',
						duration: 1500
					});
					showTypeLabel = pressed;
				}}
				class="w-fit"
			>
				<Type class="h-4 w-4" />
			</Toggle>
			<div class="w-10"></div>
			<Button size="sm" disabled={hasContentChanged} onclick={handleUpdateDocument}>
				{cap(m[selectedContent ? 'save_changes' : 'confirm']())}
			</Button>
		</div>
		<div
			class="overflow-scroll text-xs"
			style={`${jsonHTML ? 'max-height: 23dvh; margin-bottom: 1rem;' : ''}`}
		>
			{@html jsonHTML}
		</div>
		<Hr />
	</div>
	<div class="px-1.5">
		{@render ObjectEditor([], schema, true)}
	</div>
</div>
