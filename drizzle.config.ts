import { defineConfig } from 'drizzle-kit';

const projectStatus = (process.env.PROJECT_STATUS ?? 'DEV').toUpperCase();

const url =
	projectStatus === 'PROD'
		? (process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL)
		: 'file:local.db';

if (!url) {
	throw new Error(
		'DATABASE_URL or TURSO_DATABASE_URL must be set when PROJECT_STATUS=PROD'
	);
}

const authToken = projectStatus === 'PROD' ? process.env.TURSO_AUTH_TOKEN : undefined;

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url,
		...(authToken ? { authToken } : {})
	},
	verbose: true,
	strict: true
});
