import ResizePlugin from "./ResizePlugin";
import IframeOnClick from "./IframeClick";
import { Locale } from "./i18n";

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
  container.addEventListener("click", (e: Event) => {
    const target: HTMLElement = e.target as HTMLElement;
    if (e.target && ["img", "video"].includes(target.tagName.toLowerCase())) {
      resizeTarge = target;
      resizePlugin = new ResizePlugin(
        target,
        container.parentElement as HTMLElement,
        options
      );
    }
  });

  quill.on("text-change", (delta: any, source: string) => {
    // iframe 大小调整
    container.querySelectorAll("iframe").forEach((item: HTMLIFrameElement) => {
      normalizeYouTubeIframe(item);

      IframeOnClick.track(item, () => {
        resizeTarge = item;
        resizePlugin = new ResizePlugin(
          item,
          container.parentElement as HTMLElement,
          options
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
