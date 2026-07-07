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
export declare function extractImageFiles(source: FileList | DataTransferItemList | null | undefined): File[];
/**
 * Attempts to downscale/re-encode an image file via an offscreen canvas.
 * Best-effort: gracefully returns the original file unchanged if
 * `options` is falsy, or if the runtime doesn't support a 2D canvas
 * context (e.g. some headless/legacy environments) — this is a
 * progressive enhancement, not a guarantee, so callers must be prepared
 * to receive the original file back.
 */
export declare function compressImage(file: File, options?: ImageCompressionOptions | false): Promise<File | Blob>;
