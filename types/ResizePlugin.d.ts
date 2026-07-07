import "./ResizePlugin.less";
import { I18n, Locale } from "./i18n";
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
interface ResizePluginOption {
    locale?: Locale;
    onChange?: (element: HTMLElement) => void;
    /**
     * Live Quill instance, used internally to persist width/height/align
     * through the Delta model. Set automatically by QuillResizeModule; not
     * meant to be provided directly by consumers.
     */
    __quillInstance?: any;
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
    constructor(resizeTarget: ResizeElement, container: HTMLElement, options?: ResizePluginOption);
    initResizer(): void;
    positionResizerToTarget(el: HTMLElement): void;
    bindEvents(): void;
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
    startResize(e: MouseEvent): void;
    endResize(): void;
    resizing(e: MouseEvent): void;
    destroy(): void;
    /**
     * @deprecated Use destroy() instead. Kept as an alias for backward
     * compatibility with any code calling the previous (misspelled) method
     * name directly.
     */
    destory(): void;
}
export default ResizePlugin;
