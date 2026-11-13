import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'The database connection string (used as fallback; DEV uses local SQLite by default).',
		required: false
	},
	ORIGIN: {
		description: 'The app origin (base URL), e.g. `http://localhost:5173`.'
	},
	BETTER_AUTH_SECRET: {
		description: 'Secret used to sign tokens. For production use 32 characters generated with high entropy. See [Better Auth installation](https://www.better-auth.com/docs/installation).'
	},
	TURSO_AUTH_TOKEN: {
		description: 'Auth token for a remote libSQL/Turso database (optional for local file DBs).',
		required: false
	},
	TURSO_DATABASE_URL: {
		description: 'Turso/libSQL database URL for production (used when PROJECT_STATUS=PROD).',
		required: false
	},
	PROJECT_STATUS: {
		description: 'Environment mode: DEV uses local SQLite, PROD uses Turso/remote DB.',
		required: false
	}
});
