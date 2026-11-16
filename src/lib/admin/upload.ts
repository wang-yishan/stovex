import { uploadImages } from '#lib/admin/api.ts';

/**
 * Open a file-picker flow is outside this helper; this handles the input event:
 * reads the first file, uploads it, returns the resulting URL (or null if none).
 */
export async function pickUploadedImage(
	event: Event,
	opts?: { onSuccess?: (url: string) => void }
): Promise<string | null> {
	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	input.value = '';
	if (!file) return null;

	const [uploaded] = await uploadImages([file]);
	if (!uploaded) return null;
	opts?.onSuccess?.(uploaded.url);
	return uploaded.url;
}
