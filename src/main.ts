import ResizePlugin from "./ResizePlugin";
import IframeOnClick from "./IframeClick";
import { Locale } from "./i18n";
import { registerResizeFormats } from "./formats";

interface Quill {
  container: HTMLElement;
  root: HTMLElement; // edit area
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

function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/i,
    /(?:youtube\.com\/embed\/)([\w-]{11})/i,
    /(?:youtu\.be\/)([\w-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(url);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function normalizeYouTubeIframe(iframe: HTMLIFrameElement) {
  const src = iframe.getAttribute("src") || "";
  if (!isYouTubeUrl(src)) {
    return;
  }

  const videoId = extractYouTubeVideoId(src);
  if (!videoId) {
    return;
  }

  const origin = encodeURIComponent(globalThis.location.origin);
  const normalizedSrc =
    `https://www.youtube.com/embed/${videoId}` +
    `?enablejsapi=1&playsinline=1&origin=${origin}&rel=0`;

  if (iframe.src !== normalizedSrc) {
    iframe.src = normalizedSrc;
  }

  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
}

function QuillResizeModule(
  quill: Quill,
  options?: QuillResizeModuleOptions
): ResizeModuleHandle {
  const container: HTMLElement = quill.root as HTMLElement;
  let resizeTarge: HTMLElement | null;
  let resizePlugin: ResizePlugin | null;
  const trackedIframes = new Set<HTMLIFrameElement>();

  // Enables width/height/align to persist through Quill Delta round trips
  // (getContents()/setContents()) instead of relying solely on inline
  // styles. No-ops for duck-typed/mock Quill instances that don't expose a
  // real Parchment-backed constructor.
  registerResizeFormats((quill as { constructor?: any }).constructor);
  const pluginOptions: QuillResizeModuleOptions = {
    ...options,
    __quillInstance: quill,
  };

  const onContainerClick = (e: Event) => {
    const target: HTMLElement = e.target as HTMLElement;
    if (e.target && ["img", "video"].includes(target.tagName.toLowerCase())) {
      resizeTarge = target;
      resizePlugin = new ResizePlugin(
        target,
        container.parentElement as HTMLElement,
        pluginOptions
      );
    }
  };
  container.addEventListener("click", onContainerClick);

  const onTextChange = (_delta: any, _oldDelta: any, _source: string) => {
    // Re-scan iframes after each text change to (re)apply resize tracking
    container.querySelectorAll("iframe").forEach((item: HTMLIFrameElement) => {
      normalizeYouTubeIframe(item);

      trackedIframes.add(item);
      IframeOnClick.track(item, () => {
        resizeTarge = item;
        resizePlugin = new ResizePlugin(item, container.parentElement as HTMLElement, {
          ...pluginOptions,
          // Don't steal focus onto the resize handle here: this callback
          // fires from IframeClick's polling loop, which itself relies on
          // `document.activeElement === iframe` to know the iframe is
          // still the active target. Moving focus away immediately after
          // construction would make that check think focus was lost,
          // causing it to re-run this callback every poll tick instead of
          // once per focus. img/video (activated via a plain "click", not
          // a focus-polling loop) don't have this constraint.
          __autoFocus: false,
        });
      });
    });
  };
  quill.on("text-change", onTextChange);

  const onOutsidePointerDown = (e: Event) => {
    const target = e.target as HTMLElement;
    if (
      target !== resizeTarge &&
      !resizePlugin?.resizer?.contains?.(target)
    ) {
      resizePlugin?.destroy?.();
      resizePlugin = null;
      resizeTarge = null;
    }
  };
  // "pointerdown" (rather than "mousedown") fires immediately for mouse,
  // touch, and pen alike, so tapping outside the active media on a touch
  // device closes the overlay just as promptly as a mouse click does.
  document.addEventListener("pointerdown", onOutsidePointerDown, {
    capture: true,
  });

  return {
    /**
     * Removes every listener this module registered (container click,
     * quill text-change, the document-wide outside-click watcher) and
     * destroys the active resizer overlay, if any. Also stops tracking any
     * iframes this instance registered with IframeOnClick, so the shared
     * polling interval it manages can be freed once no editor needs it.
     */
    destroy() {
      container.removeEventListener("click", onContainerClick);
      quill.off?.("text-change", onTextChange);
      document.removeEventListener("pointerdown", onOutsidePointerDown, {
        capture: true,
      } as EventListenerOptions);
      resizePlugin?.destroy?.();
      resizePlugin = null;
      resizeTarge = null;
      trackedIframes.forEach((iframe) => IframeOnClick.untrack(iframe));
      trackedIframes.clear();
    },
  };
}

export default QuillResizeModule;
export type { QuillResizeModuleOptions, ToolbarOptions, ResizeModuleHandle };
