import { argon2id } from '@noble/hashes/argon2.js';
import { randomBytes } from 'node:crypto';
import { hashPassword as hashScrypt, verifyPassword as verifyScrypt } from 'better-auth/crypto';

// OWASP-recommended Argon2id parameters (memory-hard, modern default).
const ARGON2 = {
	m: 19_456, // 19 MiB
	t: 2, // iterations
	p: 1, // parallelism
	dkLen: 32
} as const;

const toB64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64').replace(/=+$/g, '');

const fromB64 = (value: string) => {
	const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
	return new Uint8Array(Buffer.from(value + pad, 'base64'));
};

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const hash = argon2id(password, salt, {
		m: ARGON2.m,
		t: ARGON2.t,
		p: ARGON2.p,
		dkLen: ARGON2.dkLen
	});
	return `$argon2id$v=19$m=${ARGON2.m},t=${ARGON2.t},p=${ARGON2.p}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword(data: { hash: string; password: string }): Promise<boolean> {
	const { hash, password } = data;

	// Argon2id (PHC string) — new hashes.
	if (hash.startsWith('$argon2')) {
		const parts = hash.split('$');
		// ["", "argon2id", "v=19", "m=...,t=...,p=...", "<salt>", "<hash>"]
		if (parts.length !== 6) return false;
		const params = Object.fromEntries(
			parts[3].split(',').map((pair) => {
				const [k, v] = pair.split('=');
				return [k, Number(v)];
			})
		) as { m: number; t: number; p: number };
		const salt = fromB64(parts[4]);
		const expected = fromB64(parts[5]);
		const actual = argon2id(password, salt, {
			m: params.m,
			t: params.t,
			p: params.p,
			dkLen: expected.length
		});
		if (actual.length !== expected.length) return false;
		// constant-time compare
		let diff = 0;
		for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
		return diff === 0;
	}

	// Legacy scrypt hashes (<saltHex>:<keyHex>) — verify for existing users.
	return verifyScrypt({ hash, password });
}