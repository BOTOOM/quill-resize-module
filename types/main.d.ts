import { Locale } from "./i18n";
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
    onChange?: (element: HTMLElement) => void;
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
export type { QuillResizeModuleOptions, ToolbarOptions, ResizeModuleHandle };
