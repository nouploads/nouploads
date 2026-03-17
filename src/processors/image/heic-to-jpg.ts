export interface HeicToJpgOptions {
  quality: number; // 0.0 to 1.0
}

export async function heicToJpg(
  input: Blob,
  options: HeicToJpgOptions = { quality: 0.92 }
): Promise<Blob> {
  const heic2any = (await import('heic2any')).default;

  const result = await heic2any({
    blob: input,
    toType: 'image/jpeg',
    quality: options.quality,
  });

  // heic2any can return a single Blob or an array of Blobs (for multi-image HEIC)
  if (Array.isArray(result)) {
    return result[0];
  }
  return result;
}
