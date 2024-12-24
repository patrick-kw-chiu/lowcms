<script lang="ts">
	import { nanoid } from 'nanoid';

	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';

	import * as m from '$lib/paraglide/messages.js';

	import { cap } from '$lib/utilities/utilities.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import StorageOption from '../../tag/storage-option/storage-option.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Card from '$lib/components/ui/card';
	import type { DatabaseConfig } from '$lib/types/types.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

	type FormState = Omit<DatabaseConfig, 'createdAt' | 'updatedAt' | 'tags'>;

	interface Props {
		open: boolean;
		name?: string;
		id?: string;
		addDbConfig: (formState: FormState) => void;
	}
	let { open = $bindable(), addDbConfig }: Props = $props();

	const getDefaultFormState = () => {
		const id = nanoid(32);
		return {
			id,
			name: uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }),
			storageOption: 'local' as DatabaseConfig['storageOption'],
			description: '',
			directoryHandle: undefined
		};
	};

	let formState = $state<FormState>(getDefaultFormState());
	const selectFileOrDirectory = async () => {
		try {
			let directorHandle = await window.showDirectoryPicker({
				id: formState.id
			});

			formState.directoryHandle = directorHandle;

			if (!formState.name) {
				formState.name = formState.directoryHandle!.name;
			}
		} catch (error) {
			console.error(error);
		}
	};
	$effect(() => {
		if (!open) {
			formState = getDefaultFormState();
		}
	});

	// let singleOrMultipleJSONFiles = $state<'single' | 'multiple'>('multiple');
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="md:max-w-[720px]">
		<Dialog.Header>
			<Dialog.Title>
				{cap(
					m.add_x({
						x: m.database()
					})
				)}
			</Dialog.Title>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="name" class="text-right">{cap(m.name())}</Label>
				<Input id="name" bind:value={formState.name} class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right">{cap(m.storageOption())}</Label>
				<Tabs.Root bind:value={formState.storageOption} class="w-[400px]">
					<Tabs.List>
						<Tabs.Trigger value="local" class="px-4">
							<StorageOption storageOption={'local'} />
						</Tabs.Trigger>
						<Tabs.Trigger value="browser" class="px-4" disabled>
							<StorageOption storageOption={'browser'} />
						</Tabs.Trigger>
					</Tabs.List>
					<Card.Description class="pt-2">
						{cap(
							formState.storageOption === 'local' ? m.localDescription() : m.browserDescription()
						)}
					</Card.Description>
				</Tabs.Root>
			</div>
			<!-- {#if formState.storageOption === 'local'}
				<div class="grid grid-cols-4 items-center gap-4">
					<Label class="text-right">{cap(m.singleOrMultipleJSONFiles())}</Label>
					<Tabs.Root bind:value={singleOrMultipleJSONFiles} class="w-[400px]">
						<Tabs.List>
							<Tabs.Trigger value="single" class="px-4">
								{cap(m.single())}
							</Tabs.Trigger>
							<Tabs.Trigger value="multiple" class="px-4">
								{cap(m.multiple())}
							</Tabs.Trigger>
						</Tabs.List>
						<Card.Description class="pt-2">
							{@html cap(
								m[
									singleOrMultipleJSONFiles === 'single'
										? 'singleJSONFileDescription'
										: 'multipleJSONFilesDescription'
								]()
							)}
						</Card.Description>
					</Tabs.Root>
				</div>
			{/if} -->
			{#if formState.storageOption === 'local'}
				<div class="grid grid-cols-4 items-center gap-4">
					<Label class="text-right">
						{cap(m.directory())}
					</Label>
					<div class="flex items-center gap-2">
						{#if formState.directoryHandle}
							<div>{formState.directoryHandle.name}</div>
						{/if}
						<Button size="sm" variant="outline" onclick={selectFileOrDirectory}>
							{cap(
								m.select_x({
									// x: m[singleOrMultipleJSONFiles === 'single' ? 'file' : 'directory']()
									x: m.directory()
								})
							)}
						</Button>
					</div>
				</div>
			{/if}
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="description" class="text-right">{cap(m.description())}</Label>
				<Textarea id="description" bind:value={formState.description} class="col-span-3" />
			</div>
		</div>
		<Dialog.Footer>
			<Button type="submit" onclick={() => addDbConfig($state.snapshot(formState))}>
				{cap(m.add_x({ x: m.database() }))}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
