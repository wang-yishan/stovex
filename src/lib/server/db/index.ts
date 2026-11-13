import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { DATABASE_URL, TURSO_AUTH_TOKEN, TURSO_DATABASE_URL, PROJECT_STATUS } from '$app/env/private';

const projectStatus = (PROJECT_STATUS ?? 'DEV').toUpperCase();

const url =
	projectStatus === 'PROD'
		? (TURSO_DATABASE_URL ?? DATABASE_URL)
		: 'file:local.db';

if (!url) {
	throw new Error(
		'DATABASE_URL or TURSO_DATABASE_URL must be set when PROJECT_STATUS=PROD'
	);
}

const client = createClient({
	url,
	...(projectStatus === 'PROD' && TURSO_AUTH_TOKEN ? { authToken: TURSO_AUTH_TOKEN } : {})
});

export const db = drizzle(client, { schema });
