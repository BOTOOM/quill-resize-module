declare class Iframe {
    element: HTMLIFrameElement;
    cb: () => void;
    hasTracked: boolean;
    constructor(element: HTMLIFrameElement, cb: () => void);
}
declare class IframeClick {
    static resolution: number;
    static iframes: Array<Iframe>;
    static interval: ReturnType<typeof setInterval> | null;
    static track(element: HTMLIFrameElement, cb: () => void): void;
    /**
     * Stops tracking a single iframe (e.g. it was removed from the DOM or its
     * owning Quill instance was destroyed). Stops the shared polling interval
     * once no iframes are left, so destroying every Quill instance using this
     * module leaves no dangling timers behind.
     */
    static untrack(element: HTMLIFrameElement): void;
    static checkClick(): void;
}
export default IframeClick;
