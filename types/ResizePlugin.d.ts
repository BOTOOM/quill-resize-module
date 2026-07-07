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
    /** Show/hide the whole floating toolbar. Default: true. */
    showToolbar?: boolean;
    /** Display the current width/height as a small label. Default: false. */
    showSize?: boolean;
    toolbar?: ToolbarOptions;
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
    initResizer(): void;
    /**
     * Applies the showToolbar/toolbar.sizeTools/toolbar.alignTools options
     * to the overlay markup. Re-run on every initResizer() call (not just on
     * first creation) since the overlay element may be reused across
     * activations of the same ResizePlugin/QuillResizeModule instance.
     */
    applyToolbarVisibility(): void;
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
    toolbarInputChange(e: Event): void;
    toolbarClick(e: MouseEvent): void;
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
export type { ResizeChangeEvent };
