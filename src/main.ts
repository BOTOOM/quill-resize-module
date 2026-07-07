import ResizePlugin from "./ResizePlugin";
import IframeOnClick from "./IframeClick";
import { Locale } from "./i18n";
import { registerResizeFormats } from "./formats";

interface Quill {
  container: HTMLElement;
  root: HTMLElement; // edit area
  on: any;
}
interface QuillResizeModuleOptions {
  locale?: Locale;
  onChange?: (element: HTMLElement) => void;
  [index: string]: any;
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

function QuillResizeModule(quill: Quill, options?: QuillResizeModuleOptions) {
  const container: HTMLElement = quill.root as HTMLElement;
  let resizeTarge: HTMLElement | null;
  let resizePlugin: ResizePlugin | null;

  // Enables width/height/align to persist through Quill Delta round trips
  // (getContents()/setContents()) instead of relying solely on inline
  // styles. No-ops for duck-typed/mock Quill instances that don't expose a
  // real Parchment-backed constructor.
  registerResizeFormats((quill as { constructor?: any }).constructor);
  const pluginOptions: QuillResizeModuleOptions = {
    ...options,
    __quillInstance: quill,
  };

  container.addEventListener("click", (e: Event) => {
    const target: HTMLElement = e.target as HTMLElement;
    if (e.target && ["img", "video"].includes(target.tagName.toLowerCase())) {
      resizeTarge = target;
      resizePlugin = new ResizePlugin(
        target,
        container.parentElement as HTMLElement,
        pluginOptions
      );
    }
  });

  quill.on("text-change", (_delta: any, _oldDelta: any, _source: string) => {
    // Re-scan iframes after each text change to (re)apply resize tracking
    container.querySelectorAll("iframe").forEach((item: HTMLIFrameElement) => {
      normalizeYouTubeIframe(item);

      IframeOnClick.track(item, () => {
        resizeTarge = item;
        resizePlugin = new ResizePlugin(
          item,
          container.parentElement as HTMLElement,
          pluginOptions
        );
      });
    });
  });

  document.addEventListener(
    "mousedown",
    (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target !== resizeTarge &&
        !resizePlugin?.resizer?.contains?.(target)
      ) {
        resizePlugin?.destory?.();
        resizePlugin = null;
        resizeTarge = null;
      }
    },
    { capture: true }
  );
}

export default QuillResizeModule;
