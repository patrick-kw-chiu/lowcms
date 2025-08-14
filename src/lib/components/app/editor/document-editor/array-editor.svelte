<!--
@component
It could edit a single `document` or document inside a `collection`.
-->

<script lang="ts">
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import { innerWidth } from 'svelte/reactivity/window';
	import { fade } from 'svelte/transition';
	// Libraries - shadcn
	import { Badge } from '$lib/components/ui/badge';
	import * as Sheet from '$lib/components/ui/sheet';
	// Libraries - lucide
	import SquarePen from 'lucide-svelte/icons/square-pen';
	import X from 'lucide-svelte/icons/x';
	// Types
	import type { JSONObject } from '$lib/types/types.svelte';
	import type { Selected } from 'bits-ui';
	import type { JSONSchema7 } from 'json-schema';
	// IndexedDB
	// Utilities
	import {
		cap,
		extractWhitespaceParts,
		getValueByJsonPaths,
		setValueByJsonPathsMutable
	} from '$lib/utilities/utilities.svelte';
	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';

	// Components
	import Button from '$lib/components/ui/button/button.svelte';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import Trash_2 from 'lucide-svelte/icons/trash-2';
	import ConfirmToRemove from '../../popover/confirm-to-remove.svelte';
	import RemovableSelect from '../../removable-select/removable-select.svelte';
	import DocumentEditor from './document-editor.svelte';

	interface Props {
		config: JSONSchema7;
		jsonPaths: string[];
		data: JSONObject;
	}
	let { config, jsonPaths, data }: Props = $props();
	let items = $derived(config!.items) as JSONSchema7;
	let array = $derived(getValueByJsonPaths(data, jsonPaths));
	$effect(() => {
		if (!array) {
			array = setValueByJsonPathsMutable(data, jsonPaths, {
				isGetNestedFieldOnly: true,
				isArray: true
			});
		}
	});
	let fields = $derived(Object.keys(array[0] ?? {}));
	let stringFields = $derived(fields.filter((field) => typeof array[0][field] === 'string'));

	// State
	let selectedObject = $state<JSONObject>();
	let selectedObjectIndex = $state<number>();
	let objectIndexToRemove = $state(-1);

	const getContainerId = (index: number) => {
		return `${index.toString()}_${jsonPaths.join('-')}`;
	};

	const getStringEnums = () => {
		return items!.enum!.filter((label) => !array?.includes(label));
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
			const array = setValueByJsonPathsMutable(data, jsonPaths, {
				isGetNestedFieldOnly: true
			});
			const [item] = array.splice(dragIndex, 1);
			array.splice(dropIndex, 0, item);
		}
	};

	const addStringEnum = (enumValue: string) => {
		console.log('addStringEnum');
		const array = setValueByJsonPathsMutable(data, jsonPaths, {
			isGetNestedFieldOnly: true,
			isArray: true
		});
		array.push(enumValue);
	};

	const removeStringEnum = (index: number) => {
		console.log('removeStringEnum', { index });
		const array = setValueByJsonPathsMutable(data, jsonPaths, {
			isGetNestedFieldOnly: true,
			isArray: true
		});
		array.splice(index, 1);
	};

	console.log({
		'config.items': $state.snapshot(config.items),
		array: $state.snapshot(array),
		data: $state.snapshot(data),
		jsonPaths: $state.snapshot(jsonPaths)
	});
</script>

{#snippet StringItem(enumValue: string, index: number, disabled: boolean = false)}
	<Badge>
		<div
			class="svelte-dnd-touch-feedback cursor-move"
			use:draggable={{ container: getContainerId(index), dragData: index }}
			use:droppable={{
				container: getContainerId(index),
				callbacks: { onDrop: handleDrop }
			}}
		>
			{#each extractWhitespaceParts(enumValue) as part}
				<span style={part.isWhiteSpace ? 'text-decoration: wavy underline;' : ''}>
					{part.content}
				</span>
			{/each}
		</div>
		{#if !disabled}
			<X
				class="h-4 w-4 cursor-pointer"
				style="transform: translateX(0.125rem)"
				onclick={() => removeStringEnum(index)}
			/>
		{/if}
	</Badge>
{/snippet}

{#if items!.type === 'string'}
	<div class="mb-2">
		<RemovableSelect
			options={getStringEnums().map((label) => ({
				label: label as string,
				value: label as string
			}))}
			onSelectedChange={(item) => {
				const { value } = item as Selected<string>;
				addStringEnum(value);
			}}
			placeholder={cap(m.select_x({ x: m.enumeration() }))}
		/>
	</div>
	<div class="flex flex-row gap-2">
		{#each array as item, index}
			{@render StringItem(item, index)}
		{/each}
	</div>
{:else if items!.type === 'object'}
	<div class="flex flex-col gap-2">
		{#each array as item, index (index)}
			<div class="flex flex-row items-center gap-2">
				<Button variant="ghost" size="icon" class="h-8 w-8">
					<SquarePen
						class="h-5 w-5"
						onclick={() => {
							selectedObject = item;
							selectedObjectIndex = index;
						}}
					/>
				</Button>
				<Button class="h-8 w-8" variant="ghost" size="icon">
					<Trash_2
						class="h-5 w-5"
						onclick={() => {
							objectIndexToRemove = index;
						}}
					/>
				</Button>
				<ConfirmToRemove
					bind:open={
						() => objectIndexToRemove === index,
						() => {
							objectIndexToRemove = -1;
						}
					}
					deleteTarget={`"${stringFields.length > 0 ? item[stringFields[0]] : 'item ' + index}"`}
					onConfirm={() => {
						const array = setValueByJsonPathsMutable(data, jsonPaths, {
							isGetNestedFieldOnly: true,
							isArray: true
						});
						array.splice(index, 1);
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
					class="svelte-dnd-touch-feedback flex cursor-move gap-2 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-blue-200"
				>
					<div class="flex flex-col">
						{#each stringFields.slice(0, 2) as field}
							<h3 class="text-base">
								<span class="text-gray-500">{field}:</span>
								<span class="font-medium text-gray-900">{item[field]}</span>
							</h3>
						{/each}
						{#if stringFields.length === 0}
							<span class="text-gray-500">Item {index}</span>
						{/if}
					</div>
				</div>
			</div>
		{/each}
		<button
			class="flex w-fit flex-row items-center gap-2 rounded-lg p-1.5 opacity-80 hover:bg-gray-500/10 hover:opacity-100"
			onclick={() => {
				selectedObject = {};
				selectedObjectIndex = array.length;
			}}
		>
			<CirclePlus class="h-5 w-5" />
			<div class="text-medium">
				{cap(m.add_x({ x: m.object() }))}
			</div>
		</button>

		<Sheet.Root
			bind:open={
				() => Boolean(selectedObject),
				() => {
					selectedObject = undefined;
					selectedObjectIndex = undefined;
				}
			}
		>
			<Sheet.Content
				class="!max-w-[788px] p-3 py-6"
				style={`width: ${Math.max(innerWidth.current ?? 200, 968) - 180}px`}
			>
				<!-- TODO bandaid fix for reactivity -->
				<span class="hidden">{innerWidth.current}</span>
				<DocumentEditor
					contentType={'document'}
					rows={array}
					schema={config.items as JSONSchema7}
					checkedRowIndexes={[selectedObjectIndex!]}
					onUpdateSuccess={() => {
						console.log('onUpdateSuccess');
						selectedObject = undefined;
						selectedObjectIndex = undefined;
					}}
				/>
			</Sheet.Content>
		</Sheet.Root>
	</div>
{/if}
