<!--
@component

- Render `rows` (array of objects) as a table, with the fields specified `schema`
- `rows` could be a collection, or a documentsGroup
- Support filtering
-->

<script lang="ts">
	import sift, { createEqualsOperation } from 'sift';
	import { innerWidth } from 'svelte/reactivity/window';
	// Libraries - shadcn
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Table from '$lib/components/ui/table';
	// Libraries - lucide
	import Braces from 'lucide-svelte/icons/braces';
	import SquarePen from 'lucide-svelte/icons/square-pen';
	import Workflow from 'lucide-svelte/icons/workflow';
	// Types
	import type { Content, FilterObject, JSONObject } from '$lib/types/types.svelte';
	import type { JSONSchema7 } from 'json-schema';
	// Utilities
	import {
		cap,
		checkHasIDField,
		getLowCMSTypeByConfig,
		hasPropertyWithValues
	} from '$lib/utilities/utilities.svelte';
	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';

	// Components
	import { invalidateAll } from '$app/navigation';
	import DocumentEditor from '../editor/document-editor/document-editor.svelte';
	import FilterObjectEditor from '../editor/filter-object-editor/filter-object-editor.svelte';
	import JsonFieldSelector from '../json-field-selector/json-field-selector.svelte';
	import FieldFilter from './field-filter.svelte';
	interface Props {
		rows: JSONObject[];
		schema: JSONSchema7;
		selectedContents: Content[];
		contentType: 'document' | 'collection';
		onAttemptedToEditRows?: (rowIndexes: number[], rows: JSONObject[]) => void;
		content?: Content;
		onSelectRelationship?: (document: JSONObject) => void;
	}
	let {
		rows,
		schema,
		selectedContents,
		contentType,
		onAttemptedToEditRows,
		content,
		onSelectRelationship
	}: Props = $props();
	let isToSelectRelationship = $derived(Boolean(content) && Boolean(onSelectRelationship));
	let rowsWithRawIndex = $derived(
		Array.isArray(rows)
			? rows.map((row, index) => {
					return {
						...row,
						____rawIndex____: index
					} as JSONObject & { ____rawIndex____: number };
				})
			: []
	);
	let entries = $derived(
		Object.entries(schema?.properties ?? {}).sort((a, b) => {
			const isAIDField = checkHasIDField({ properties: a });
			const isBIDField = checkHasIDField({ properties: b });
			const relationshipQuery = [
				{ key: 'type', values: ['x_relationship_one_to_one', 'x_relationship_one_to_many'] }
			];
			const isARelationshipField = hasPropertyWithValues({ properties: a }, relationshipQuery);
			const isBRelationshipField = hasPropertyWithValues({ properties: b }, relationshipQuery);

			if (isAIDField && !isBIDField) {
				return -1;
			} else if (!isAIDField && isBIDField) {
				return 1;
			} else if (isARelationshipField && !isBRelationshipField) {
				return -1;
			} else if (!isARelationshipField && isBRelationshipField) {
				return 1;
			} else {
				return 0;
			}
		})
	) as [string, JSONSchema7][];
	console.log({ entries: $state.snapshot(entries) });

	// State
	let checkedRowIndexes = $state<number[]>([]);
	let isContentEditorOpen = $derived(checkedRowIndexes.length > 0);

	let filterObject = $state<FilterObject>({});
	let filteredRows = $derived.by(() => {
		console.log({ filterObject: $state.snapshot(filterObject) });
		// return mongoSearch(rowsWithRawIndex, filterObject);
		return rowsWithRawIndex.filter(
			sift(filterObject, {
				operations: {
					____rawRegexValue____(_, ownerQuery, options) {
						return createEqualsOperation(() => true, ownerQuery, options);
					}
				}
			})
		);
	});
	$effect(() => {
		if (rows) {
			filterObject = {};
		}
	});

	const onUpdateSuccess = () => {
		isContentEditorOpen = false;
		invalidateAll();
	};
</script>

<Card.Root class={isToSelectRelationship ? 'border-none' : ''}>
	{#if contentType === 'collection' || Object.keys(filterObject).length > 0}
		<Card.Header>
			{#if !isToSelectRelationship && contentType === 'collection'}
				<div class="flex justify-end">
					<Button
						size="sm"
						class="h-8"
						onclick={() => {
							checkedRowIndexes = [rowsWithRawIndex.length];
							onAttemptedToEditRows?.([rowsWithRawIndex.length], []);
						}}
					>
						{cap(m.add_x({ x: m.document() }))}
					</Button>
				</div>
			{:else if isToSelectRelationship}
				<!-- TODO: locales -->
				<div>Select a document in "<b>{content!.name}</b>" to create a relationship</div>
			{/if}
			<FilterObjectEditor {filterObject} isRoot={true} />
			<div class="py-2 text-center text-sm text-muted-foreground">
				{#if rows.length === filteredRows.length}
					{cap(m.showing_x_y({ x: rows.length, y: m.documents() }))}
				{:else}
					{cap(
						m.showing_x_out_of_y_z({
							x: filteredRows.length,
							y: rows.length,
							z: m.documents()
						})
					)}
				{/if}
			</div>
		</Card.Header>
	{/if}
	<Card.Content>
		<Table.Root class={'overflow-scroll'} style="min-height: 440px">
			<Table.Header>
				<Table.Row>
					<Table.Head class="sticky left-0 bg-background">
						<span class="sr-only">Actions</span>
					</Table.Head>
					{#each entries as [field, config]}
						<Table.Head>
							{field}
							<FieldFilter {field} {config} {filterObject} />
						</Table.Head>
					{/each}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each filteredRows as row}
					<Table.Row>
						<Table.Cell class="sticky left-0 bg-background">
							{#if isToSelectRelationship}
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8"
									onclick={() => {
										onSelectRelationship?.(row);
									}}
								>
									<Workflow class="h-5 w-5" />
								</Button>
							{:else}
								<!-- <Checkbox
								onCheckedChange={(checked) => {
									if (checked) {
										checkedRowIndexes.push(row.____rawIndex____);
									} else {
										checkedRowIndexes.splice(checkedRowIndexes.indexOf(row.____rawIndex____), 1);
									}
								}}
							/> -->
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8"
									onclick={() => {
										checkedRowIndexes = [row.____rawIndex____];
										onAttemptedToEditRows?.([row.____rawIndex____], [row]);
									}}
								>
									<SquarePen class="h-5 w-5" />
								</Button>
							{/if}
						</Table.Cell>
						{#each entries as [field, config]}
							<Table.Cell
								class="truncate"
								style={`max-width: calc((100vw - 330px) / ${entries.length})`}
							>
								{#if ['object', 'array-of-objects'].includes(getLowCMSTypeByConfig(config)) && row[field]}
									<Dialog.Root>
										<Dialog.Trigger>
											<Button variant="ghost" size="icon" class="h-6 w-6">
												<Braces class="h-4 w-4" />
											</Button>
										</Dialog.Trigger>
										<Dialog.Content class="max-w-[425px]">
											<div class="py-4">
												<JsonFieldSelector json={row[field]} disabled={true} />
											</div>
										</Dialog.Content>
									</Dialog.Root>
								{:else}
									{row[field]}
								{/if}
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
				{#if filteredRows.length === 0}
					<div class="absolute" style="left: 50%; top: 50%; transform: translate(-50%, -50%);">
						<!-- TODO locales -->
						🥺 No data found. Please refine your search.
					</div>
				{/if}
			</Table.Body>
		</Table.Root>
	</Card.Content>
	<Card.Footer class="gap-4">
		<div class="w-full py-2 text-center text-sm text-muted-foreground">
			{#if rows.length === filteredRows.length}
				{cap(m.showing_x_y({ x: rows.length, y: m.documents() }))}
			{:else}
				{cap(
					m.showing_x_out_of_y_z({
						x: filteredRows.length,
						y: rows.length,
						z: m.documents()
					})
				)}
			{/if}
		</div>
	</Card.Footer>
	<Sheet.Root bind:open={isContentEditorOpen}>
		<Sheet.Content
			class="!max-w-[848px] p-3 py-6"
			style={`width: ${Math.max(innerWidth.current ?? 200, 968) - 120}px`}
		>
			<!-- TODO bandaid fix for reactivity -->
			<span class="hidden">{innerWidth.current}</span>
			<DocumentEditor
				{contentType}
				{selectedContents}
				{rows}
				{schema}
				{checkedRowIndexes}
				{onUpdateSuccess}
			/>
		</Sheet.Content>
	</Sheet.Root>
</Card.Root>
