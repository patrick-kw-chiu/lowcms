import { getContentsByDatabaseId, getDatabaseConfigById, getSchemas } from '$lib/db/db';
import type { Content, Schema } from '$lib/types/types.svelte.js';
import { queryPermission } from '$lib/utilities/utilities.svelte';

type LoadingState = 'pending' | 'success' | 'not-found';

const defaultResponse = {
	loadingState: 'not-found' as LoadingState,
	isPermitted: false,
	contents: [],
	schemas: []
};

export const load = async ({
	url
}): Promise<{
	databaseId: string | null;
	contentId: string | null;
	schemaId: string | null;
	viewDocumentAs: 'document' | 'documentsGroup' | null;
	//
	databaseConfig?: Awaited<ReturnType<typeof getDatabaseConfigById>>;
	loadingState: LoadingState;
	isPermitted: boolean;
	contents: Content[];
	schemas: Schema[];
}> => {
	const databaseId = url.searchParams.get('databaseId');
	const contentId = url.searchParams.get('contentId');
	const schemaId = url.searchParams.get('schemaId');
	const viewDocumentAs = url.searchParams.get('viewDocumentAs') as
		| 'document'
		| 'documentsGroup'
		| null;
	console.log({ databaseId, contentId, viewDocumentAs });

	if (!databaseId) {
		return {
			...defaultResponse,
			databaseId,
			contentId,
			schemaId,
			viewDocumentAs
		};
	}

	const [databaseConfig, contents, schemas] = await Promise.all([
		getDatabaseConfigById(databaseId),
		getContentsByDatabaseId(databaseId),
		getSchemas({ limit: 999 })
	]);
	console.log({ databaseConfig, contents, schemas });
	if (!databaseConfig) {
		return {
			...defaultResponse,
			databaseId,
			contentId,
			schemaId,
			viewDocumentAs
		};
	}

	const isPermitted = await queryPermission(databaseConfig.directoryHandle!);
	console.log({ isPermitted });
	return {
		...defaultResponse,
		databaseId,
		contentId,
		schemaId,
		viewDocumentAs,
		//
		databaseConfig,
		loadingState: 'success',
		isPermitted,
		contents,
		schemas
	};
};
