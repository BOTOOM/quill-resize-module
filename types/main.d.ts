import type { ResizeChangeEvent } from "./ResizePlugin";
import { Locale } from "./i18n";
import type { AlignValue } from "./formats";
interface Quill {
    container: HTMLElement;
    root: HTMLElement;
    on: any;
    off?: any;
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
    /** Show/hide the whole floating toolbar. Default: true. */
    showToolbar?: boolean;
    /** Display the current width/height as a small label. Default: false. */
    showSize?: boolean;
    toolbar?: ToolbarOptions;
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
export type { QuillResizeModuleOptions, ToolbarOptions, ResizeModuleHandle, ResizeChangeEvent, };
