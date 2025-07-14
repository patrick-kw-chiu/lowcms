<script lang="ts">
	// Libraries
	import { onDestroy } from 'svelte';
	import { liveQuery, type Subscription } from 'dexie';
	import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

	// Libraries - shadcn
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Toggle } from '$lib/components/ui/toggle';

	// Libraries - lucide
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import HardDrive from 'lucide-svelte/icons/hard-drive';
	import Globe from 'lucide-svelte/icons/globe';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';

	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';

	// Types
	import { type DatabaseConfig } from '$lib/types/types.svelte';

	// IndexedDB
	import { db, deleteDatabaseConfigById, getDatabaseConfigById } from '$lib/db/db.js';

	// Constants and locales
	import { BASE_PATH, DATABASE_STORAGE_OPTIONS } from '$lib/constants/constants.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import StorageOption from '$lib/components/app/tag/storage-option/storage-option.svelte';
	import DeleteDbConfigDialog from '$lib/components/app/dialog/delete-db-config-dialog/delete-db-config-dialog.svelte';
	import AddDbConfigDialog from '$lib/components/app/dialog/add-db-config-dialog/add-db-config-dialog.svelte';

	// Components
	// import ConfirmationDialog from '$lib/components/app/dialog/confirmation-dialog/confirmation-dialog.svelte';

	// States - filters and paginations
	let databaseStorage = $state<'all' | 'local' | 'local'>('all');
	let isDesc = $state(false);
	let page = $state(1);
	let limit = $state(10);

	// States - delete databaseConfig dialog
	let deleteDbConfigDialogOpen = $state(false);

	// States - databaseConfigs
	let dbConfigsObvervables = $derived.by(() => {
		// Without the console.log line
		// $derived.by isn't triggered by changes of databaseStorage, isDesc
		console.log({ databaseStorage, isDesc });

		return liveQuery(async () => {
			const dbConfigs = db.databaseConfigs
				.where('storageOption')
				.anyOf(databaseStorage === 'all' ? ['local', 'browser'] : databaseStorage);

			return await (isDesc
				? dbConfigs.reverse().sortBy('updatedAt')
				: dbConfigs.sortBy('updatedAt'));
		});
	});
	let numOfDbConfigs = $state(0);
	let dbConfigsSubscription = $state<Subscription>();
	$effect(() => {
		dbConfigsSubscription = dbConfigsObvervables.subscribe({
			next: (dbConfigs) => {
				console.log({ dbConfigs });
				numOfDbConfigs = dbConfigs.length;
				const maxPage = Math.ceil(numOfDbConfigs / limit);
				if (maxPage !== 0 && page > maxPage) {
					page = maxPage;
				}
			}
		});
	});

	// States - selectedDatabaseConfigId
	let selectedDatabaseConfigId = $state('');
	$effect(() => {
		getSelectedDatabaseConfig(selectedDatabaseConfigId);
	});

	// States - add databaseConfig dialog
	let addDbConfigDialogOpen = $state(false);

	onDestroy(() => {
		dbConfigsSubscription?.unsubscribe();
	});

	let selectedDatabaseConfig = $state<DatabaseConfig>();

	const getSelectedDatabaseConfig = async (selectedDatabaseConfigId: string) => {
		selectedDatabaseConfig = (await getDatabaseConfigById(selectedDatabaseConfigId))!;
	};

	const addDbConfig = async (
		dbConfig: Omit<DatabaseConfig, 'createdAt' | 'updatedAt' | 'tags'>
	) => {
		console.log({ dbConfig });
		try {
			const id = await db.databaseConfigs.add({
				...dbConfig,
				name:
					dbConfig.name?.trim() ||
					uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }), // big_red_donkey
				// description: generateRandomText(200),
				// storageOption: Math.random() > 0.5 ? 'local' : 'browser',
				// tags: Math.random() > 0.5 ? ['tag-1', 'tag-2'] : ['tag-3', 'tag-4'],
				tags: [],
				//
				createdAt: new Date(),
				updatedAt: new Date()
			});

			console.log({ id });

			addDbConfigDialogOpen = false;
		} catch (error) {
			console.log(`Failed to add: ${error}`);
		}
	};

	const deleteDbConfig = async () => {
		await deleteDatabaseConfigById(selectedDatabaseConfigId);
		// reset
		selectedDatabaseConfigId = '';
		deleteDbConfigDialogOpen = false;
	};

	const cardHeader = $derived({
		title: m.x_databases({ x: cap(m[databaseStorage]()) }),
		description:
			databaseStorage === 'all'
				? ''
				: databaseStorage === 'local'
					? m.localDescription()
					: m.browserDescription()
	});
</script>

<svelte:head>
	<title>Databases | LowCMS</title>
	<meta
		name="description"
		content="Mount your local directory as a database to be managed by LowCMS."
	/>
</svelte:head>
<Tabs.Root bind:value={databaseStorage}>
	<div class="flex items-center">
		<Tabs.List>
			{#each DATABASE_STORAGE_OPTIONS as option}
				<Tabs.Trigger value={option}>{cap(m[option]())}</Tabs.Trigger>
			{/each}
		</Tabs.List>
		<div class="ml-auto flex items-center gap-2">
			<Toggle bind:pressed={isDesc}>Asc</Toggle>
			<Button size="sm" class="h-8 gap-1" onclick={() => (addDbConfigDialogOpen = true)}>
				<CirclePlus class="h-3.5 w-3.5" />
				<span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
					{cap(
						m.add_x({
							x: m.database()
						})
					)}
				</span>
			</Button>
		</div>
	</div>
	<Card.Root class="mt-2">
		<Card.Header>
			<Card.Title>{cardHeader.title}</Card.Title>
			<Card.Description>
				{cardHeader.description}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>{cap(m.name())}</Table.Head>
						<Table.Head>{cap(m.storageOption())}</Table.Head>
						<!-- <Table.Head class="hidden md:table-cell">{cap(m.tags())}</Table.Head> -->
						<Table.Head class="hidden lg:table-cell">{cap(m.description())}</Table.Head>
						<Table.Head class="hidden md:table-cell">{cap(m.updatedAt())}</Table.Head>
						<Table.Head class="hidden lg:table-cell">{cap(m.createdAt())}</Table.Head>
						<Table.Head>
							<span class="sr-only">Actions</span>
						</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if $dbConfigsObvervables}
						{#each $dbConfigsObvervables as dbConfig, index (dbConfig.id)}
							{#if index >= (page - 1) * limit && index < page * limit}
								<Table.Row>
									<Table.Cell class="font-medium">{dbConfig.name}</Table.Cell>
									<Table.Cell class="database-config-table-storage-option-cell">
										<StorageOption storageOption={dbConfig.storageOption} />
									</Table.Cell>
									<!-- <Table.Cell class="hidden md:table-cell">
										{#each dbConfig.tags as tag}
											<Badge variant="outline">{tag}</Badge>
										{/each}
									</Table.Cell> -->
									<Table.Cell class="database-config-table-description-cell hidden lg:table-cell">
										{dbConfig.description}
									</Table.Cell>
									<Table.Cell class="hidden md:table-cell">
										{dbConfig.updatedAt.toDateString()}
									</Table.Cell>
									<Table.Cell class="hidden lg:table-cell">
										{dbConfig.createdAt.toDateString()}
									</Table.Cell>
									<Table.Cell>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger asChild let:builder>
												<Button
													aria-haspopup="true"
													size="icon"
													variant="ghost"
													builders={[builder]}
												>
													<Ellipsis class="h-4 w-4" />
													<span class="sr-only">Toggle menu</span>
												</Button>
											</DropdownMenu.Trigger>
											<DropdownMenu.Content align="end">
												<DropdownMenu.Label>{cap(m.actions())}</DropdownMenu.Label>
												<a
													href={`/${BASE_PATH}/databases/database/content?databaseId=${dbConfig.id}`}
												>
													<DropdownMenu.Item>
														{cap(m.connect())}
													</DropdownMenu.Item>
												</a>
												<DropdownMenu.Item
													onclick={() => {
														deleteDbConfigDialogOpen = true;
														selectedDatabaseConfigId = dbConfig.id;
													}}
												>
													{cap(m._delete())}
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									</Table.Cell>
								</Table.Row>
							{/if}
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</Card.Content>
		<Card.Footer class="gap-4">
			<Button variant="outline" size="icon" disabled={page === 1} onclick={() => page--}>
				<ChevronLeft class="h-4 w-4" />
			</Button>
			<div class="text-xs text-muted-foreground">
				{cap(
					m.showing_start_to_end_of_total_x({
						start: (page - 1) * limit + 1,
						end: Math.min(numOfDbConfigs, page * limit),
						total: numOfDbConfigs,
						x: m.databases()
					})
				)}
			</div>
			<Button
				variant="outline"
				size="icon"
				disabled={page === Math.ceil(numOfDbConfigs / limit)}
				onclick={() => page++}
			>
				<ChevronRight class="h-4 w-4" />
			</Button>
		</Card.Footer>
	</Card.Root>

	<DeleteDbConfigDialog
		bind:open={deleteDbConfigDialogOpen}
		name={selectedDatabaseConfig?.name}
		id={selectedDatabaseConfig?.id}
		{deleteDbConfig}
	/>

	<AddDbConfigDialog bind:open={addDbConfigDialogOpen} {addDbConfig} />
</Tabs.Root>

<style>
	:global(.database-config-table-storage-option-cell) {
		min-width: 120px;
	}

	:global(.database-config-table-description-cell) {
		max-width: 300px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
</style>
