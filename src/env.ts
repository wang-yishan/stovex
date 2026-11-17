import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PROJECT_STATUS: {
		description: 'Environment mode: DEV or PROD.',
		required: false
	},
	DATABASE_URL: {
		description: 'Local database URL used when PROJECT_STATUS=DEV (defaults to file:local.db).',
		required: false
	},
	TURSO_DATABASE_URL: {
		description: 'Turso/libSQL database URL used when PROJECT_STATUS=PROD.',
		required: false
	},
	TURSO_AUTH_TOKEN: {
		description: 'Auth token for the Turso/libSQL database (used in PROD when required).',
		required: false
	},
	ORIGIN: {
		description: 'The app origin (base URL), e.g. `http://localhost:5173`.'
	},
	BETTER_AUTH_SECRET: {
		description:
			'Secret used to sign tokens. For production use 32 characters generated with high entropy. See [Better Auth installation](https://www.better-auth.com/docs/installation).'
	},
	GOOGLE_CLIENT_ID: {
		description: 'Google OAuth client ID for "Continue with Google" sign-in.',
		required: false
	},
	GOOGLE_CLIENT_SECRET: {
		description: 'Google OAuth client secret for "Continue with Google" sign-in.',
		required: false
	}
});
