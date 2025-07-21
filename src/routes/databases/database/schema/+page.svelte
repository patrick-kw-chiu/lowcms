<script lang="ts">
	// Libraries
	import { goto, invalidateAll } from '$app/navigation';
	import { innerWidth } from 'svelte/reactivity/window';

	// Libraries - shadcn
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';

	// Libraries - lucide
	import SquarePen from 'lucide-svelte/icons/square-pen';
	import Trash_2 from 'lucide-svelte/icons/trash-2';

	// Utilities
	import { cap, getQueryString, getValueByJsonPaths } from '$lib/utilities/utilities.svelte';

	// IndexedDB
	import { deleteSchemaById, updateSchema } from '$lib/db/db.js';

	// Types
	import type { JSONSchema7 } from 'json-schema';
	import type { Selected } from 'bits-ui';
	import type { Schema, Content, JSONObject } from '$lib/types/types.svelte';

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
	import SchemaEditor from '$lib/components/app/editor/schema-editor/schema-editor.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Hr from '$lib/components/app/hr.svelte';
	import DocumentEditor from '$lib/components/app/editor/document-editor/document-editor.svelte';
	import ConfirmToRemove from '$lib/components/app/popover/confirm-to-remove.svelte';

	const { data } = $props();
	const { databaseId, databaseConfig, schemaId, schemas, contents } = $derived(data);

	// let schemaToEdit = $derived($state.snapshot(schemas).find((schema) => schema.id === schemaId));
	let schemaToEdit = $state<Schema>();
	$effect(() => {
		if (schemaId) {
			schemaToEdit = $state.snapshot(schemas).find((schema) => schema.id === schemaId);
		} else {
			schemaToEdit = undefined;
		}
	});
	let contentsLinkToSchema = $derived<Content[]>(
		schemaToEdit ? contents.filter((content) => content.schemaId === schemaToEdit!.id) : []
	);
	let schemaToRemove = $state<Schema>();

	const handleConfirmToRemove = async () => {
		console.log({ schemaToRemove });
		await deleteSchemaById(schemaToRemove!.id);
		resetRemoveState();
		invalidateAll();
	};

	const resetRemoveState = () => {
		schemaToRemove = undefined;
	};

	const resetState = () => {
		window.history.back();
	};

	const handleUpdateSchema = async () => {
		console.log({ schemaToEdit, schemaId });
		if (!schemaToEdit || !schemaId) {
			return;
		}

		const isUpdated = await updateSchema(schemaId, {
			title: schemaToEdit.title,
			description: schemaToEdit.description,
			properties: $state.snapshot(schemaToEdit.properties)
		});

		if (isUpdated) {
			invalidateAll();
			window.history.back();
		} else {
			// TODO locales
			toast.error('Failed to update schema');
		}
	};
</script>

<svelte:head>
	<title>Schema | LowCMS</title>
	<meta
		name="description"
		content="Validate and safeguard your editing experience with JSON Schema."
	/>
</svelte:head>
<div class="p-12" style="height: 100dvh">
	<Toaster richColors />
	<Card.Root class="lc-long-content w-full" style="height: calc(100% - 3.5rem)">
		{#if schemas.length === 0}
			<div class="absolute" style="left: 50%; top: 50%; transform: translate(-50%, -50%);">
				<!-- TODO locales -->
				🥺 No schema found. Please create a content and attach it to a schema.
			</div>
		{:else}
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>
								<span class="sr-only">Actions</span>
							</Table.Head>
							<Table.Head>
								{cap(m.title())}
							</Table.Head>
							<Table.Head>
								{cap(m.description())}
							</Table.Head>
							<Table.Head>
								{cap(m.usage())}
							</Table.Head>
							<Table.Head>
								{cap(m.properties())}
							</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each schemas as schema}
							<Table.Row>
								<Table.Cell>
									<Button
										variant="ghost"
										size="icon"
										class="h-8 w-8"
										onclick={() => {
											const queryString = getQueryString({
												databaseId,
												schemaId: schema.id
											});
											goto(window.location.pathname + queryString);
										}}
									>
										<SquarePen class="h-5 w-5" />
									</Button>
									{#if contents.filter((content) => content.schemaId === schema.id).length > 0}
										<Tooltip.Root>
											<Tooltip.Trigger class="flex items-center gap-2">
												<Button variant="ghost" size="icon" class="h-8 w-8" disabled={true}>
													<Trash_2 class="h-5 w-5" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content side="bottom">
												<!-- TODO locales -->
												There are contents using this schema. Please remove them first.
											</Tooltip.Content>
										</Tooltip.Root>
									{:else}
										<Button
											variant="ghost"
											size="icon"
											class="h-8 w-8"
											onclick={() => {
												schemaToRemove = schema;
											}}
										>
											<Trash_2 class="h-5 w-5" />
										</Button>
									{/if}
									<ConfirmToRemove
										bind:open={
											() => schemaToRemove?.id === schema.id,
											(open) => {
												// TODO Fix code smell
												setTimeout(() => {
													if (!open) {
														resetRemoveState();
													}
												}, 50);
											}
										}
										deleteTarget={`"${schemaToRemove?.title}"`}
										onConfirm={handleConfirmToRemove}
										onCancel={() => {
											console.log('cancel');
										}}
									/>
								</Table.Cell>
								<Table.Cell class="truncate">
									{schema.title}
								</Table.Cell>
								<Table.Cell class="truncate">
									{schema.description}
								</Table.Cell>
								<Table.Cell class="truncate">
									{cap(
										m.used_by_x_y({
											x: contents.filter((content) => content.schemaId === schema.id).length,
											y: m.content()
										})
									)}
									{#each contents.filter((content) => content.schemaId === schema.id) as content}
										<li>
											<a
												href={`/${BASE_PATH}/databases/database/content${getQueryString({
													databaseId,
													contentId: content.id,
													viewDocumentAs: content.type === 'document' ? 'document' : undefined
												})}`}
												class="underline decoration-dashed"
												style="text-underline-offset: 4px"
											>
												{content.name}
											</a>
										</li>
									{/each}
								</Table.Cell>
								<Table.Cell class="truncate" style="min-width: 35dvw">
									<Textarea disabled value={JSON.stringify(schema.properties, null, 2)} />
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		{/if}
		<Sheet.Root
			bind:open={
				() => !!schemaToEdit,
				() => {
					resetState();
				}
			}
		>
			<Sheet.Content
				class="!max-w-[848px] overflow-scroll p-4 pt-10"
				style={`width: ${Math.max(innerWidth.current ?? 200, 968) - 120}px`}
			>
				<div class="flex justify-end">
					<Button size="sm" onclick={handleUpdateSchema}>
						{cap(m.save_changes())}
					</Button>
				</div>
				<div class="flex w-full flex-col gap-2 py-4">
					<Label for="title">{cap(m.title())}</Label>
					<Input
						id="title"
						bind:value={() => schemaToEdit!.title, (value) => (schemaToEdit!.title = value)}
					/>
					<Label for="description">{cap(m.description())}</Label>
					<Input
						id="description"
						bind:value={
							() => schemaToEdit!.description, (value) => (schemaToEdit!.description = value)
						}
					/>
				</div>
				<div
					class={`relative mb-2 whitespace-break-spaces rounded-xl bg-accent p-4 font-mono text-xs`}
				>
					<SchemaEditor
						bind:jsonSchema={schemaToEdit!.properties as JSONSchema7}
						disabled={false}
					/>
				</div>
				<div>
					{cap(m.used_by_x_y({ x: contentsLinkToSchema.length, y: m.content() }))}
					{#each contentsLinkToSchema as content}
						<li>
							<a
								href={`/${BASE_PATH}/databases/database/content${getQueryString({
									databaseId,
									contentId: content.id,
									viewDocumentAs: content.type === 'document' ? 'document' : undefined
								})}`}
								class="underline decoration-dashed"
								style="text-underline-offset: 4px"
							>
								{content.name}
							</a>
						</li>
					{/each}
				</div>
			</Sheet.Content>
		</Sheet.Root>
	</Card.Root>
</div>
