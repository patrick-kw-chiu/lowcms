<script lang="ts">
	// Libraries
	import { onDestroy } from 'svelte';
	import { liveQuery, type Subscription } from 'dexie';

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

	// Libraries - lucide
	import Boxes from 'lucide-svelte/icons/boxes';
	import FileText from 'lucide-svelte/icons/file-text';

	// Utilities
	import { cap } from '$lib/utilities/utilities.svelte';

	// Types
	import {} from '$lib/types/types.svelte';

	// IndexedDB
	import { db, deleteDatabaseConfigById, getDatabaseConfigById } from '$lib/db/db.js';

	// Constants and locales
	import { DATABASE_SECTIONS } from '$lib/constants/constants.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import StorageOption from '$lib/components/app/tag/storage-option/storage-option.svelte';
	import DeleteDbConfigDialog from '$lib/components/app/dialog/delete-db-config-dialog/delete-db-config-dialog.svelte';
	import AddDbConfigDialog from '$lib/components/app/dialog/add-db-config-dialog/add-db-config-dialog.svelte';

	// Components
	// import ConfirmationDialog from '$lib/components/app/dialog/confirmation-dialog/confirmation-dialog.svelte';

	// import type { PageProps } from '$types';

	import { page } from '$app/state';

	const { data } = $props();
	const { loadingState, databaseConfig, isPermitted } = data;

	console.log({ loadingState, databaseConfig, isPermitted });
</script>

<div>123</div>
<div>123</div>
