/* Bag Store Admin — signed-in user display helpers (name, initials, avatar).

   The avatar prefers the Google/social photo (`image`) and falls back to a
   single-letter initial built from the nickname / username / name. */

export interface ProfileUser {
	id?: string;
	name?: string | null;
	nickname?: string | null;
	username?: string | null;
	email?: string | null;
	image?: string | null;
	phone?: string | null;
	address?: string | null;
}

/** Display name: nickname, then full name, then email. */
export function profileDisplayName(user: ProfileUser | null | undefined): string {
	const nickname = user?.nickname?.trim();
	const name = user?.name?.trim();
	return nickname || name || user?.email?.trim() || 'User';
}

/** Avatar source: the uploaded/Google photo when present, else undefined. */
export function profileImageUrl(user: ProfileUser | null | undefined): string | undefined {
	const image = user?.image?.trim();
	return image || undefined;
}

/** 1-letter initial: nickname → username → name → email. */
export function profileInitials(user: ProfileUser | null | undefined): string {
	const source =
		user?.nickname?.trim() ||
		user?.username?.trim() ||
		user?.name?.trim() ||
		user?.email?.trim() ||
		'';
	const initial = source.split(/\s+/).filter(Boolean)[0]?.[0]?.toUpperCase() ?? '';
	return initial || 'U';
}
