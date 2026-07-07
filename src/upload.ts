/**
 * Optional hooks for wiring pasted/dropped images into a real upload
 * pipeline, with best-effort client-side compression before upload.
 *
 * Both are entirely opt-in: this module only intercepts paste/drop events
 * when `onImageUpload` is configured (see `wireImageUpload` in main.ts), so
 * default behavior (Quill's own native image-paste-as-base64 handling) is
 * completely unaffected for consumers who don't use this feature.
 */

/** Bounds and quality applied when compressing an image before upload. */
export interface ImageCompressionOptions {
  /** Maximum width in pixels. The image is only ever downscaled, never upscaled. */
  maxWidth?: number;
  /** Maximum height in pixels. The image is only ever downscaled, never upscaled. */
  maxHeight?: number;
  /** Encoder quality (0-1) for lossy output formats. Default: 0.8. */
  quality?: number;
  /** Output MIME type. Defaults to the original file's type, or "image/jpeg". */
  mimeType?: string;
}

/**
 * Extracts image files from a paste/drop event's file list (or clipboard
 * items), ignoring anything that isn't an image (e.g. pasted text,
 * dropped non-image files).
 */
export function extractImageFiles(
  source: FileList | DataTransferItemList | null | undefined
): File[] {
  if (!source) {
    return [];
  }
  const files: File[] = [];
  for (let i = 0; i < source.length; i++) {
    const entry = source[i];
    const file =
      "getAsFile" in entry && typeof entry.getAsFile === "function"
        ? entry.getAsFile()
        : (entry as unknown as File);
    if (file && file.type && file.type.startsWith("image/")) {
      files.push(file);
    }
  }
  return files;
}

function readFileAsDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for compression"));
    img.src = src;
  });
}

/** Computes a downscaled (never upscaled) size that fits within maxWidth/maxHeight, preserving aspect ratio. */
function computeTargetSize(
  width: number,
  height: number,
  options: ImageCompressionOptions
): { width: number; height: number } {
  let ratio = 1;
  if (options.maxWidth && width > options.maxWidth) {
    ratio = Math.min(ratio, options.maxWidth / width);
  }
  if (options.maxHeight && height > options.maxHeight) {
    ratio = Math.min(ratio, options.maxHeight / height);
  }
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Attempts to downscale/re-encode an image file via an offscreen canvas.
 * Best-effort: gracefully returns the original file unchanged if
 * `options` is falsy, or if the runtime doesn't support a 2D canvas
 * context (e.g. some headless/legacy environments) — this is a
 * progressive enhancement, not a guarantee, so callers must be prepared
 * to receive the original file back.
 */
export async function compressImage(
  file: File,
  options?: ImageCompressionOptions | false
): Promise<File | Blob> {
  if (!options) {
    return file;
  }
  if (typeof document === "undefined" || typeof Image === "undefined") {
    return file;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return file;
  }

  try {
    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImage(dataUrl);
    const sourceWidth = img.naturalWidth || img.width;
    const sourceHeight = img.naturalHeight || img.height;
    const { width, height } = computeTargetSize(
      sourceWidth,
      sourceHeight,
      options
    );
    canvas.width = width || sourceWidth;
    canvas.height = height || sourceHeight;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const mimeType = options.mimeType || file.type || "image/jpeg";
    const quality = options.quality ?? 0.8;

    return await new Promise<File | Blob>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob || file),
        mimeType,
        quality
      );
    });
  } catch {
    // Decoding/drawing failed (corrupt file, unsupported format, etc.) —
    // fall back to the original file rather than blocking the upload.
    return file;
  }
}
