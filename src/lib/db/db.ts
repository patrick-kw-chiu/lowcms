import Dexie, { type EntityTable } from 'dexie';

import type { DatabaseConfig, Content, Schema } from '$lib/types/types.svelte';

const db = new Dexie('LowCMSDatabase') as Dexie & {
	databaseConfigs: EntityTable<
		DatabaseConfig,
		// primary key "id" (for the typings only)
		'id'
	>;
	contents: EntityTable<
		Content,
		// primary key "id" (for the typings only)
		'id'
	>;
	schemas: EntityTable<
		Schema,
		// primary key "id" (for the typings only)
		'id'
	>;
};

// Schema declaration:
db.version(1).stores({
	// primary key "id" (for the runtime!)
	databaseConfigs: 'id, name, description, createdAt, updatedAt, *tags, storageOption',
	contents:
		'id, name, description, createdAt, updatedAt, *tags, databaseId, schemaId, type, filePath, fileType, jsonPath',
	schemas: 'id, title, description, createdAt, updatedAt, *tags'
});

// DatabaseConfig
const getDatabaseConfigById = async (id: string) => {
	return (await db.databaseConfigs.get({ id }))!;
};

const updateDatabaseConfig = async (
	databaseConfigId: string,
	databaseConfig: Partial<Omit<DatabaseConfig, 'id'>>
) => {
	return await db.databaseConfigs.update(databaseConfigId, databaseConfig);
};

const deleteDatabaseConfigById = async (id: string) => {
	return await db.databaseConfigs.delete(id);
};

// Content
const createContent = async (content: Content) => {
	return await db.contents.add(content);
};

const getContentsByDatabaseId = async (databaseId: string) => {
	return await db.contents.where('databaseId').equals(databaseId).toArray();
};

const updateContent = async (contentId: string, content: Partial<Omit<Content, 'id'>>) => {
	return await db.contents.update(contentId, content);
};

const deleteContentById = async (id: string) => {
	return await db.contents.delete(id);
};

// Schema
const createSchema = async (schema: Schema) => {
	return await db.schemas.add(schema);
};

const getSchemas = async ({
	page = 1,
	limit = 10,
	orderBy = 'updatedAt',
	order = 'desc'
}: {
	page?: number;
	limit?: number;
	orderBy?: 'updatedAt' | 'createdAt';
	order?: 'desc' | 'asc';
}) => {
	if (order === 'desc') {
		return await db.schemas
			.orderBy(orderBy)
			.reverse()
			.offset((page - 1) * limit)
			.limit(limit)
			.toArray();
	}

	return await db.schemas
		.orderBy(orderBy)
		.offset((page - 1) * limit)
		.limit(limit)
		.toArray();
};

const getSchemaById = async (id: string) => {
	return await db.schemas.get({ id });
};

const updateSchema = async (schemaId: string, schema: Partial<Omit<Schema, 'id'>>) => {
	return await db.schemas.update(schemaId, schema);
};

const deleteSchemaById = async (id: string) => {
	return await db.schemas.delete(id);
};

export {
	db,
	// DatabaseConfig
	getDatabaseConfigById,
	updateDatabaseConfig,
	deleteDatabaseConfigById,
	// Content
	createContent,
	getContentsByDatabaseId,
	updateContent,
	deleteContentById,
	// Schema
	createSchema,
	getSchemas,
	getSchemaById,
	updateSchema,
	deleteSchemaById
};
