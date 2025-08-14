<!--
@component
It could edit a single `document` or document inside a `collection`.
-->

<script lang="ts">
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import { getContext } from 'svelte';
	import { innerWidth } from 'svelte/reactivity/window';
	import { fade } from 'svelte/transition';
	// Libraries - shadcn
	import * as Alert from '$lib/components/ui/alert';
	import * as Sheet from '$lib/components/ui/sheet';
	// Libraries - lucide
	import AlertCircleIcon from 'lucide-svelte/icons/alert-circle';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import SquarePen from 'lucide-svelte/icons/square-pen';
	import Trash_2 from 'lucide-svelte/icons/trash-2';
	// Types
	import type {
		Content,
		JSONObject,
		JSONSchema7WithCustomKeyword,
		Schema
	} from '$lib/types/types.svelte';
	// IndexedDB
	// Utilities
	import {
		cap,
		getJsonContent,
		getValueByJsonPaths,
		setValueByJsonPathsMutable
	} from '$lib/utilities/utilities.svelte';
	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';

	// Components
	import Button from '$lib/components/ui/button/button.svelte';
	import ContentTable from '../../content-table/content-table.svelte';
	import ConfirmToRemove from '../../popover/confirm-to-remove.svelte';

	interface Props {
		config: JSONSchema7WithCustomKeyword;
		jsonPaths: string[];
		data: JSONObject;
	}
	let { config, jsonPaths, data }: Props = $props();
	let { 'x-content-id': xContentId, 'x-id-field': xIdField } = config;
	let relationships = $derived(getValueByJsonPaths(data, jsonPaths));
	$effect(() => {
		if (!relationships) {
			relationships = setValueByJsonPathsMutable(data, jsonPaths, {
				isGetNestedFieldOnly: true,
				isArray: true
			});
		}
	});

	// Context
	const { schemas, contents } = (getContext('data') ?? { schemas: [], contents: [] }) as {
		schemas: Schema[];
		contents: Content[];
	};
	const content = $derived(contents.find((content) => content.id === xContentId));
	const schema = $derived(schemas.find((schema) => schema.id === content?.schemaId));
	let fileHasContent = $state(false);
	let jsonContent = $state<JSONObject | undefined>(undefined);

	$effect(() => {
		if (content) {
			loadJsonContent();
		}
	});

	const loadJsonContent = async () => {
		if (!content || !schema) {
			return;
		}

		const result = await getJsonContent(
			content.fileHandle!,
			content.jsonPath ? content.jsonPath.split('.') : [],
			{ expectedType: 'json' }
		);

		console.log({ result });

		fileHasContent = result.fileHasContent;

		if (typeof result.content === 'object') {
			jsonContent = result.content;
		}
	};

	console.log({ config: $state.snapshot(config), contents, xContentId, content, schema });

	// State
	let selectedObject = $state<JSONObject>();
	let selectedObjectIndex = $state<number>();
	let objectIndexToRemove = $state(-1);

	const getContainerId = (index: number) => {
		return `${index.toString()}_${jsonPaths.join('-')}`;
	};

	const handleDrop = (state: DragDropState) => {
		const { draggedItem, targetContainer } = state;
		const sourceContainerFieldId = state.sourceContainer?.split('_').slice(1).join('_');
		const targetContainerFieldId = state.targetContainer?.split('_').slice(1).join('_');

		if (sourceContainerFieldId !== targetContainerFieldId) {
			console.log(
				`Not the same container: ${sourceContainerFieldId} !== ${targetContainerFieldId}`
			);
			console.log({ state: $state.snapshot(state) });
			return;
		}

		const dragIndex = draggedItem as number;
		const dropIndex = parseInt(targetContainer ?? '0');

		if (dragIndex !== -1 && !isNaN(dropIndex)) {
			const relationships = setValueByJsonPathsMutable(data, jsonPaths, {
				isGetNestedFieldOnly: true
			});
			const [item] = relationships.splice(dragIndex, 1);
			relationships.splice(dropIndex, 0, item);
		}
	};

	const onSelectRelationship = (document: JSONObject) => {
		console.log({ document, xIdField });
		const relationships = setValueByJsonPathsMutable(data, jsonPaths, {
			isGetNestedFieldOnly: true
		});
		if ((config?.type as string) === 'x_relationship_one_to_many') {
			relationships.push(document[xIdField!]);
		} else {
			relationships[0] = document[xIdField!];
		}
		closeSheet();
	};

	const openSheet = () => {
		console.log('openSheet');
		selectedObject = {};
		selectedObjectIndex = relationships.length;
	};

	const closeSheet = () => {
		selectedObject = undefined;
		selectedObjectIndex = undefined;
	};
</script>

<div class="flex flex-col gap-2">
	{#each relationships as item, index (index)}
		<div class="flex flex-row items-center gap-2">
			<!-- <Button variant="ghost" size="icon" class="h-8 w-8">
				<SquarePen
					class="h-5 w-5"
					onclick={() => {
						selectedObject = item;
						selectedObjectIndex = index;
					}}
				/>
			</Button> -->
			<Button class="h-8 w-8" variant="ghost" size="icon">
				<Trash_2
					class="h-5 w-5"
					onclick={() => {
						objectIndexToRemove = index;
					}}
				/>
			</Button>
			{#if (config?.type as string) === 'x_relationship_one_to_one'}
				<Button class="h-8 w-8" variant="ghost" size="icon">
					<SquarePen class="h-5 w-5" onclick={openSheet} />
				</Button>
			{/if}
			<ConfirmToRemove
				bind:open={
					() => objectIndexToRemove === index,
					() => {
						objectIndexToRemove = -1;
					}
				}
				deleteTarget={`"${'item ' + index}"`}
				onConfirm={() => {
					const relationships = setValueByJsonPathsMutable(data, jsonPaths, {
						isGetNestedFieldOnly: true,
						isArray: true
					});
					relationships.splice(index, 1);
					objectIndexToRemove = -1;
				}}
				onCancel={() => {
					objectIndexToRemove = -1;
				}}
			/>
			<div
				use:draggable={{
					container: getContainerId(index),
					dragData: index
				}}
				use:droppable={{
					container: getContainerId(index),
					callbacks: { onDrop: handleDrop }
				}}
				in:fade={{ duration: 150 }}
				out:fade={{ duration: 150 }}
				class="svelte-dnd-touch-feedback flex cursor-move gap-2 rounded-lg bg-white p-2.5 text-gray-900 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-blue-200"
			>
				{item}
			</div>
		</div>
	{/each}
	{#if (config?.type as string) === 'x_relationship_one_to_many' || relationships?.length === 0}
		<button
			class="flex w-fit flex-row items-center gap-2 rounded-lg p-1.5 opacity-80 hover:bg-gray-500/10 hover:opacity-100"
			onclick={openSheet}
		>
			<CirclePlus class="h-5 w-5" />
			<div class="text-medium">
				{cap(m.add_x({ x: m.object() }))}
			</div>
		</button>
	{/if}

	<Sheet.Root bind:open={() => Boolean(selectedObject), closeSheet}>
		<Sheet.Content
			class="!max-w-[788px] p-3 py-6"
			style={`width: ${Math.max(innerWidth.current ?? 200, 968) - 180}px`}
		>
			<!-- TODO bandaid fix for reactivity -->
			<span class="hidden">{innerWidth.current}</span>
			{#if jsonContent}
				{#if Array.isArray(jsonContent)}
					<ContentTable
						rows={jsonContent.filter((item) => !relationships.includes(item[xIdField!]))}
						schema={schema!}
						selectedContents={[]}
						contentType={'collection'}
						{content}
						{onSelectRelationship}
					/>
				{:else if typeof jsonContent === 'object'}
					<ContentTable
						rows={[jsonContent]}
						schema={schema!}
						selectedContents={[]}
						contentType={'collection'}
						{content}
						{onSelectRelationship}
					/>
				{/if}
			{:else}
				<div class="mt-6">
					<Alert.Root variant="destructive">
						<AlertCircleIcon />
						<Alert.Title>Unable to load content <b>{content!.name}</b>.</Alert.Title>
						<Alert.Description>
							<p>
								{#if fileHasContent}
									The file containing <b>{content!.name}</b> exists, but the content is not valid JSON.
								{:else}
									Likely that the file contains <b>{content!.name}</b> is being removed, renamed or moved
									to a different location
								{/if}
							</p>
							<ul class="list-inside list-disc text-sm">
								<li>File path: <b>{content!.filePath}</b></li>
								{#if content!.jsonPath}
									<li>JSON path: <b>{content!.jsonPath}</b></li>
								{/if}
							</ul>
						</Alert.Description>
					</Alert.Root>
				</div>
			{/if}
		</Sheet.Content>
	</Sheet.Root>
</div>
