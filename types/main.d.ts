import type { ResizeChangeEvent, ResizeMediaAttributes } from "./ResizePlugin";
import { Locale } from "./i18n";
import type { AlignValue } from "./formats";
import type { ImageCompressionOptions } from "./upload";
interface Quill {
    container: HTMLElement;
    root: HTMLElement;
    on: any;
    off?: any;
    getSelection?: any;
    getLength?: any;
    insertEmbed?: any;
    setSelection?: any;
}
interface ToolbarOptions {
    /** Show/hide the width/size buttons in the toolbar. Default: true. */
    sizeTools?: boolean;
    /** Show/hide the alignment buttons in the toolbar. Default: true. */
    alignTools?: boolean;
    /**
     * @deprecated Use `alignTools` instead. Kept for backward compatibility
     * with the previous (misspelled) option name.
     */
    alingTools?: boolean;
    /**
     * Show/hide the "edit attributes" button that opens a small panel for
     * editing `alt` text (images only) and `title`. Default: true.
     */
    attributesTool?: boolean;
    /**
     * Percentages rendered as quick-size preset buttons. Default: `[100, 50]`
     * (matching the library's previous hardcoded 100%/50% buttons).
     */
    sizePresets?: number[];
    /**
     * Unit applied by the preset buttons and the width input.
     * - `"%"` (default): sets a relative `width: N%;`, so the embed keeps
     *   resizing with its container (e.g. on a responsive layout).
     * - `"px"`: sets an absolute `width: Npx; height: auto;`, computed as a
     *   percentage of the embed's original (as-inserted) size, so the embed
     *   keeps a fixed size regardless of container width.
     */
    sizeUnit?: "%" | "px";
}
/**
 * Bounds and behavior applied to every resize gesture (pointer drag,
 * keyboard arrow steps, and — where the resulting unit is `px` — toolbar
 * preset/input changes). All fields are optional; omitting a bound leaves
 * that dimension unconstrained (aside from the library's built-in 30px
 * minimum, which always applies as a safety floor).
 */
interface ResizeConstraints {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    /**
     * When true, every resize gesture preserves the original aspect ratio
     * (as if Alt were held for the whole gesture), instead of only doing so
     * while the user holds Alt.
     */
    lockAspectRatio?: boolean;
}
interface QuillResizeModuleOptions {
    locale?: Locale;
    /**
     * Fired after every change (drag, keyboard resize, toolbar click/input).
     * Kept for backward compatibility; prefer the more specific callbacks
     * below (onResizeStart/onResize/onResizeEnd/onAlignChange) for new code.
     */
    onChange?: (element: HTMLElement) => void;
    /** Fired once when the overlay activates for a new target (img/video/iframe). */
    onSelect?: (element: HTMLElement) => void;
    /** Fired when a resize gesture begins (pointer drag, keyboard step, or toolbar action). */
    onResizeStart?: (element: HTMLElement) => void;
    /**
     * Fired during a resize gesture with the current width/height/align. For
     * pointer drags this fires on every pointermove; for keyboard/toolbar
     * driven resizes (which have no separate "in progress" state) it fires
     * once with the final size.
     */
    onResize?: (element: HTMLElement, event: ResizeChangeEvent) => void;
    /** Fired when a resize gesture ends. */
    onResizeEnd?: (element: HTMLElement) => void;
    /** Fired specifically when the alignment (left/center/right/none) changes. */
    onAlignChange?: (element: HTMLElement, align: AlignValue | null) => void;
    /**
     * Fired when `alt`/`title` are saved through the attributes panel.
     * Receives only the fields that were actually present in the panel
     * (`alt` is omitted for non-`img` targets).
     */
    onAttributesChange?: (element: HTMLElement, attrs: ResizeMediaAttributes) => void;
    /** Show/hide the whole floating toolbar. Default: true. */
    showToolbar?: boolean;
    /** Display the current width/height as a small label. Default: false. */
    showSize?: boolean;
    toolbar?: ToolbarOptions;
    /** Min/max width & height bounds and aspect-ratio locking, applied to every target. */
    constraints?: ResizeConstraints;
    /**
     * Per-tag override of `constraints` (e.g. force a locked aspect ratio
     * only for `video`/`iframe` embeds, or for a custom embed tag). Fields
     * specified here take precedence over the matching field in the global
     * `constraints` for that tag.
     */
    constraintsByTag?: Partial<Record<string, ResizeConstraints>>;
    /**
     * Tags that trigger the resize overlay when clicked directly, in
     * addition to (or, since this fully replaces the default array, instead
     * of) the built-in `img`/`video` handling. Default: `["img", "video"]`.
     * Doesn't apply to iframes, which use a separate focus-polling mechanism
     * (see IframeClick) since clicks inside cross-origin iframe content
     * don't bubble to the parent document.
     */
    embedTags?: string[];
    /**
     * Custom resolver for determining which element should become the
     * resize target for a given click — lets consumers support custom
     * wrapper elements or arbitrary embed shapes without forking the
     * library (e.g. resolving a click inside a caption wrapper to the
     * wrapper itself via `clickedTarget.closest(".my-embed")`). Return the
     * element to resize, or `null`/`undefined` to fall back to the default
     * `embedTags`-based tag matching.
     */
    resolveEmbed?: (clickedTarget: HTMLElement, event: MouseEvent) => HTMLElement | null | undefined;
    /**
     * Opt-in hook for wiring pasted/dropped images into a real upload
     * pipeline (e.g. upload to S3/a CDN and return the resulting URL).
     * When set, the module intercepts image files pasted or dropped into
     * the editor, calls this hook, and inserts the resolved URL via
     * `insertEmbed` — instead of letting the browser/Quill's own clipboard
     * module embed them as base64 data URLs. Not configuring this leaves
     * paste/drop behavior completely untouched (fully backward compatible).
     * May return a plain string or a Promise resolving to one.
     */
    onImageUpload?: (file: File) => Promise<string> | string;
    /**
     * Best-effort client-side downscaling/re-encoding applied to
     * pasted/dropped images before they're passed to `onImageUpload`. Only
     * takes effect when `onImageUpload` is also configured. Set to `false`
     * (default) to disable. Gracefully no-ops (passes the original file
     * through unchanged) in environments without canvas 2D support.
     */
    imageCompression?: ImageCompressionOptions | false;
    [index: string]: any;
}
/**
 * Handle returned by QuillResizeModule (and, when registered the standard
 * Quill way via `Quill.register("modules/resize", QuillResizeModule)`,
 * retrievable through `quill.getModule("resize")`). Lets consumers tear
 * down every listener/timer this module created — important for SPA
 * frameworks that destroy and recreate Quill instances on route/component
 * changes, since the container/document/text-change listeners otherwise
 * live for as long as the page does.
 */
interface ResizeModuleHandle {
    destroy(): void;
}
declare function QuillResizeModule(quill: Quill, options?: QuillResizeModuleOptions): ResizeModuleHandle;
export default QuillResizeModule;
export type { QuillResizeModuleOptions, ToolbarOptions, ResizeModuleHandle, ResizeChangeEvent, ResizeConstraints, ResizeMediaAttributes, ImageCompressionOptions, };
