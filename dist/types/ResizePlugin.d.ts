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
    [index: string]: any;
}
declare class ResizePlugin {
    resizeTarget: ResizeElement;
    resizer: HTMLElement | null;
    container: HTMLElement;
    startResizePosition: Position | null;
    i18n: I18n;
    options: any;
    constructor(resizeTarget: ResizeElement, container: HTMLElement, options?: ResizePluginOption);
    initResizer(): void;
    positionResizerToTarget(el: HTMLElement): void;
    bindEvents(): void;
    _setStylesForToolbar(type: string, styles: string | undefined): void;
    toolbarInputChange(e: Event): void;
    toolbarClick(e: MouseEvent): void;
    startResize(e: MouseEvent): void;
    endResize(): void;
    resizing(e: MouseEvent): void;
    destory(): void;
}
export default ResizePlugin;
