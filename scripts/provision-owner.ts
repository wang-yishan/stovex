import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { hashPassword } from '#lib/server/password.ts';
import * as schema from '#lib/server/db/schema.ts';

const url = process.env.DATABASE_URL ?? 'file:local.db';
const client = createClient({ url });
const db = drizzle(client, { schema });

const EMAIL = 'admin@wyshanzz.store';
const USERNAME = 'owner_wyshanz';
const NAME = 'Owner';
const PASSWORD = '12345678';

async function main() {
	const now = new Date();
	const hashed = await hashPassword(PASSWORD);

	const existing = await db.select().from(schema.user).where(eq(schema.user.email, EMAIL)).limit(1);
	let userId: string;

	if (existing.length > 0) {
		userId = existing[0]!.id;
		await db
			.update(schema.user)
			.set({
				name: NAME,
				email: EMAIL,
				emailVerified: true,
				username: USERNAME,
				displayUsername: USERNAME,
				role: 'owner',
				updatedAt: now
			})
			.where(eq(schema.user.id, userId));
		console.log('Updated existing user', userId);
	} else {
		userId = randomUUID();
		await db.insert(schema.user).values({
			id: userId,
			name: NAME,
			email: EMAIL,
			emailVerified: true,
			createdAt: now,
			updatedAt: now,
			username: USERNAME,
			displayUsername: USERNAME,
			role: 'owner'
		});
		console.log('Created user', userId);
	}

	const accounts = await db
		.select()
		.from(schema.account)
		.where(and(eq(schema.account.userId, userId), eq(schema.account.providerId, 'credential')))
		.limit(1);

	if (accounts.length > 0) {
		await db
			.update(schema.account)
			.set({ password: hashed, accountId: userId, updatedAt: now })
			.where(eq(schema.account.id, accounts[0]!.id));
		console.log('Updated credential account');
	} else {
		await db.insert(schema.account).values({
			id: randomUUID(),
			accountId: userId,
			providerId: 'credential',
			userId,
			password: hashed,
			createdAt: now,
			updatedAt: now
		});
		console.log('Created credential account');
	}

	console.log('Provisioned owner:', { email: EMAIL, username: USERNAME, password: PASSWORD });
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
