import { defineConfig } from 'drizzle-kit';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

for (const file of ['.env', '.env.local']) {
	if (existsSync(file)) {
		try {
			loadEnvFile(file);
		} catch {
			// ignore invalid env files
		}
	}
}

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'turso',
	dbCredentials: {
		url: process.env.TURSO_DATABASE_URL!,
		authToken: process.env.TURSO_AUTH_TOKEN!
	}
});
