import "./ResizePlugin.less";
import { I18n, Locale } from "./i18n";
import { AlignValue } from "./formats";
interface Size {
    width: number;
    height: number;
}
interface Position {
    left: number;
    top: number;
    width: number;
    height: number;
}
declare class ResizeElement extends HTMLElement {
    originSize?: Size | null;
    [key: string]: any;
}
/**
 * Structured payload passed to the resize/align callbacks below, so
 * consumers get typed width/height/align data instead of having to read
 * `element.style` themselves.
 */
interface ResizeChangeEvent {
    target: HTMLElement;
    width: number;
    height: number;
    align: AlignValue | null;
}
/**
 * Media attributes editable through the toolbar's attributes panel.
 * `alt` only makes sense for `<img>` targets (native accessibility text);
 * `title` applies to any target and is exposed as a plain HTML `title`
 * attribute (tooltip).
 */
interface ResizeMediaAttributes {
    alt?: string;
    title?: string;
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
interface ResizePluginOption {
    locale?: Locale;
    /**
     * Fired after every change (drag, keyboard resize, toolbar click/input).
     * Kept for backward compatibility; prefer the more specific callbacks
     * below (onResizeStart/onResize/onResizeEnd/onAlignChange) for new code.
     */
    onChange?: (element: HTMLElement) => void;
    /** Fired once when the overlay activates for a new target. */
    onSelect?: (element: HTMLElement) => void;
    /** Fired when a resize gesture begins (pointer drag or keyboard step). */
    onResizeStart?: (element: HTMLElement) => void;
    /**
     * Fired during a resize gesture with the current width/height/align.
     * For pointer drags this fires on every pointermove; for keyboard/toolbar
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
    /** Min/max width & height bounds and aspect-ratio locking. */
    constraints?: ResizeConstraints;
    /**
     * Live Quill instance, used internally to persist width/height/align
     * through the Delta model. Set automatically by QuillResizeModule; not
     * meant to be provided directly by consumers.
     */
    __quillInstance?: any;
    /**
     * Internal only: whether to move focus onto the resize handle once the
     * overlay activates. Set to `false` by QuillResizeModule for iframes
     * tracked via IframeClick's focus-polling loop, since that loop uses
     * `document.activeElement === iframe` to detect the iframe is still
     * active — auto-focusing the handle would immediately look like a focus
     * loss to it. Not meant to be provided directly by consumers.
     */
    __autoFocus?: boolean;
    [index: string]: any;
}
declare class ResizePlugin {
    resizeTarget: ResizeElement;
    resizer: HTMLElement | null;
    container: HTMLElement;
    startResizePosition: Position | null;
    i18n: I18n;
    options: any;
    private scrollParent;
    private onScroll;
    private activePointerId;
    constructor(resizeTarget: ResizeElement, container: HTMLElement, options?: ResizePluginOption);
    /**
     * Builds the typed payload passed to onResize/onAlignChange, reading the
     * target's current width/height/align directly from the DOM so it always
     * reflects the latest state (including changes made outside this class).
     */
    _buildChangeEvent(): ResizeChangeEvent;
    /**
     * Clamps a single dimension to the configured min/max (via
     * `options.constraints`), always enforcing an absolute 30px floor as a
     * safety net (matching the library's previous unconfigurable minimum)
     * even if a smaller `minWidth`/`minHeight` is provided.
     */
    _clampDimension(value: number, min: number | undefined, max: number | undefined): number;
    /** Clamps a width/height pair using `options.constraints`. */
    _clampSize(width: number, height: number): Size;
    initResizer(): void;
    /**
     * Applies the showToolbar/toolbar.sizeTools/toolbar.alignTools options
     * to the overlay markup. Re-run on every initResizer() call (not just on
     * first creation) since the overlay element may be reused across
     * activations of the same ResizePlugin/QuillResizeModule instance.
     */
    applyToolbarVisibility(): void;
    /**
     * Renders `toolbar.sizePresets` as quick-size buttons and applies
     * `toolbar.sizeUnit` to the width input's suffix/max length. Re-run on
     * every initResizer() call (like applyToolbarVisibility()) since the
     * overlay element is reused across activations, which may carry
     * different options than whichever activation first created it.
     */
    _configureSizeToolbar(): void;
    positionResizerToTarget(el: HTMLElement): void;
    bindEvents(): void;
    /**
     * Keyboard equivalent of dragging the resize handle, so the overlay can
     * be operated without a mouse/touch pointer once it has focus:
     *  - Arrow keys resize by a small step (bigger with Shift held).
     *  - Alt+Arrow preserves the original aspect ratio, mirroring the
     *    existing Alt-drag behavior.
     *  - "0" restores the original size (same action as the toolbar's
     *    restore button).
     *  - Escape closes the overlay, by simulating the same "pointerdown
     *    outside the target" interaction that main.ts already listens for
     *    and uses to tear the overlay down — reusing that single, tested
     *    code path instead of duplicating close/cleanup logic here.
     */
    onKeyDown(e: KeyboardEvent): void;
    _setStylesForToolbar(type: string, styles: string | undefined): void;
    /**
     * Persists the current width/height/align inline styles into the Quill
     * Delta (when a live Quill instance was provided via options), so they
     * survive getContents()/setContents() round trips instead of only living
     * as inline styles on the DOM node.
     */
    _syncPersistence(): void;
    /**
     * Computes the CSS to apply for a given width preset percentage,
     * honoring `toolbar.sizeUnit`:
     * - `"%"` (default): a relative `width: N%;`.
     * - `"px"`: an absolute width computed from the target's original size,
     *   clamped to `options.constraints`, with `height: auto;` so images and
     *   videos keep their intrinsic aspect ratio.
     */
    _computeWidthStyles(percent: number): string;
    toolbarInputChange(e: Event): void;
    toolbarClick(e: MouseEvent): void;
    /**
     * Shows or hides the alt/title attributes panel. When opening (no
     * explicit `show` argument, or `show === true`), populates the inputs
     * with the target's current `alt`/`title` attributes and hides the alt
     * field for non-`img` targets (alt text only applies to images).
     */
    _toggleAttributesPanel(show?: boolean): void;
    /**
     * Applies the alt/title values currently entered in the attributes
     * panel to the resize target, persists them through Quill (if
     * available), fires onAttributesChange/onChange, and closes the panel.
     */
    _saveAttributes(): void;
    startResize(e: PointerEvent): void;
    endResize(e?: PointerEvent): void;
    resizing(e: PointerEvent): void;
    destroy(): void;
    /**
     * @deprecated Use destroy() instead. Kept as an alias for backward
     * compatibility with any code calling the previous (misspelled) method
     * name directly.
     */
    destory(): void;
}
export default ResizePlugin;
export type { ResizeChangeEvent, ResizeConstraints, ResizeMediaAttributes };
