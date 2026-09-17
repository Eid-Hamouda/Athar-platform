/**
 * Downscales and re-encodes an image in the browser before it is uploaded to
 * Supabase Storage.
 *
 * Phone photos routinely arrive at 3–5 MB. The stored object is what
 * `next/image` has to pull back down on every cache miss, and its upstream
 * fetch is aborted after a hard-coded 7 seconds — so an oversized original
 * turns into a 500 from `/_next/image` on any connection that cannot move the
 * whole file in that window. Shrinking at the source keeps the round trip
 * small for the optimiser and makes the donor's own upload far quicker.
 */

/** Long-edge cap. Well above the largest width the catalog ever renders. */
const MAX_EDGE = 1600;

/**
 * Long-edge cap for the copy sent to the vision model, which is a different
 * job from the copy that gets stored.
 *
 * The stored image is sized for the catalogue; this one only has to be legible
 * enough to classify a coat as a coat, and every byte of it is base64-encoded
 * (+33%), posted to a Server Action and then posted again to the model inside
 * a per-attempt timeout. A raw 4 MB phone photo routinely spent that whole
 * budget on upload alone and came back as a timeout — the model never got far
 * enough to fail on merit. 1024px is ample for classification and roughly a
 * quarter of the bytes.
 */
export const ANALYSIS_MAX_EDGE = 1024;
/** WebP quality — visually clean for photos at roughly a fifth of the bytes. */
const QUALITY = 0.82;

export interface CompressImageOptions {
  maxEdge?: number;
  quality?: number;
}

/**
 * Returns a WebP copy of `file`, capped to `maxEdge` on its long side.
 *
 * Falls back to the untouched original whenever the browser cannot decode or
 * re-encode the input (animated GIFs, SVG, HEIC without native support), so a
 * donation is never lost to a compression failure.
 */
export async function compressImage(
  file: File,
  { maxEdge = MAX_EDGE, quality = QUALITY }: CompressImageOptions = {}
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  // Already-animated or vector sources lose information when flattened.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  let bitmap: ImageBitmap;
  try {
    // `from-image` applies the EXIF rotation that a raw canvas draw drops.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    // A browser without WebP encoding hands back null or a PNG-sized blob.
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}
