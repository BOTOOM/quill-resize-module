/**
 * Quill-native persistence for resize/align state.
 *
 * Historically this module persisted `width`, `height` and alignment only
 * as inline styles on the DOM node, which Quill has no knowledge of. That
 * state was lost on every `getContents()` / `setContents()` round trip
 * (see GitHub issues #13 and #14). This module registers Parchment
 * attributors and blot overrides so those three properties become part of
 * the Quill Delta itself, alongside the existing inline-style behavior
 * (kept for immediate visual feedback and for consumers that don't use the
 * Delta API at all).
 *
 * `align` is exposed under the Delta attribute name `resizeAlign` rather
 * than `align` to avoid colliding with Quill's own built-in block-level
 * `align` format (paragraph text-align), which every default Quill build
 * already registers.
 */
export declare const WIDTH_FORMAT = "width";
export declare const HEIGHT_FORMAT = "height";
export declare const ALIGN_FORMAT = "resizeAlign";
export declare const VIDEO_FILE_BLOT_NAME = "videoFile";
export type AlignValue = "left" | "center" | "right";
export declare function readAlignValue(node: HTMLElement): AlignValue | undefined;
export declare function applyAlignValue(node: HTMLElement, value?: string | null): void;
/**
 * Registers resize-aware `image`, `video` (iframe embed) and `videoFile`
 * (literal `<video>` tag) blots on the given Quill class. Idempotent: safe
 * to call once per editor instance, registration only ever happens once.
 */
export declare function registerResizeFormats(QuillCtor: any): void;
/**
 * Reads the given quill instance's Parchment blot for a resize target (if
 * any) and, when found, persists the current width/height/align inline
 * styles into the Quill Delta via `formatText`, so they survive
 * `getContents()` / `setContents()` round trips.
 *
 * No-ops when the module wasn't given a live Quill instance (e.g. when
 * `ResizePlugin` is used standalone, without Quill formats registered), or
 * when the target isn't backed by a registered blot.
 */
export declare function syncResizeStateToQuill(quill: any, target: HTMLElement): void;
