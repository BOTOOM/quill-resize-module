import { Locale } from "./i18n";
interface Quill {
    container: HTMLElement;
    root: HTMLElement;
    on: any;
}
interface QuillResizeModuleOptions {
    locale?: Locale;
    onChange?: (element: HTMLElement) => void;
    [index: string]: any;
}
declare function QuillResizeModule(quill: Quill, options?: QuillResizeModuleOptions): void;
export default QuillResizeModule;
