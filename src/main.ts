import ResizePlugin from "./ResizePlugin";
import type { ResizeChangeEvent, ResizeMediaAttributes } from "./ResizePlugin";
import IframeOnClick from "./IframeClick";
import { Locale } from "./i18n";
import { registerResizeFormats } from "./formats";
import type { AlignValue } from "./formats";

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
  /**
   * Show/hide the "edit attributes" button that opens a small panel for
   * editing `alt` text (images only) and `title`. Default: true.
   */
  attributesTool?: boolean;
  /**
   * Percentages rendered as quick-size preset buttons. Default: `[100, 50]`
   * (matching the library's previous hardcoded 100%/50% buttons).
   */
  sizePresets?: number[];
  /**
   * Unit applied by the preset buttons and the width input.
   * - `"%"` (default): sets a relative `width: N%;`, so the embed keeps
   *   resizing with its container (e.g. on a responsive layout).
   * - `"px"`: sets an absolute `width: Npx; height: auto;`, computed as a
   *   percentage of the embed's original (as-inserted) size, so the embed
   *   keeps a fixed size regardless of container width.
   */
  sizeUnit?: "%" | "px";
}

/**
 * Bounds and behavior applied to every resize gesture (pointer drag,
 * keyboard arrow steps, and — where the resulting unit is `px` — toolbar
 * preset/input changes). All fields are optional; omitting a bound leaves
 * that dimension unconstrained (aside from the library's built-in 30px
 * minimum, which always applies as a safety floor).
 */
interface ResizeConstraints {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  /**
   * When true, every resize gesture preserves the original aspect ratio
   * (as if Alt were held for the whole gesture), instead of only doing so
   * while the user holds Alt.
   */
  lockAspectRatio?: boolean;
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
  /**
   * Fired when `alt`/`title` are saved through the attributes panel.
   * Receives only the fields that were actually present in the panel
   * (`alt` is omitted for non-`img` targets).
   */
  onAttributesChange?: (
    element: HTMLElement,
    attrs: ResizeMediaAttributes
  ) => void;
  /** Show/hide the whole floating toolbar. Default: true. */
  showToolbar?: boolean;
  /** Display the current width/height as a small label. Default: false. */
  showSize?: boolean;
  toolbar?: ToolbarOptions;
  /** Min/max width & height bounds and aspect-ratio locking, applied to every target. */
  constraints?: ResizeConstraints;
  /**
   * Per-tag override of `constraints` (e.g. force a locked aspect ratio
   * only for `video`/`iframe` embeds, or for a custom embed tag). Fields
   * specified here take precedence over the matching field in the global
   * `constraints` for that tag.
   */
  constraintsByTag?: Partial<Record<string, ResizeConstraints>>;
  /**
   * Tags that trigger the resize overlay when clicked directly, in
   * addition to (or, since this fully replaces the default array, instead
   * of) the built-in `img`/`video` handling. Default: `["img", "video"]`.
   * Doesn't apply to iframes, which use a separate focus-polling mechanism
   * (see IframeClick) since clicks inside cross-origin iframe content
   * don't bubble to the parent document.
   */
  embedTags?: string[];
  /**
   * Custom resolver for determining which element should become the
   * resize target for a given click — lets consumers support custom
   * wrapper elements or arbitrary embed shapes without forking the
   * library (e.g. resolving a click inside a caption wrapper to the
   * wrapper itself via `clickedTarget.closest(".my-embed")`). Return the
   * element to resize, or `null`/`undefined` to fall back to the default
   * `embedTags`-based tag matching.
   */
  resolveEmbed?: (
    clickedTarget: HTMLElement,
    event: MouseEvent
  ) => HTMLElement | null | undefined;
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

/**
 * Merges the global `constraints` with any `constraintsByTag` override for
 * the given tag (per-tag fields win), so e.g. `video`/`iframe` embeds can
 * have a locked aspect ratio while `img` doesn't, without consumers having
 * to duplicate the whole constraints object per tag.
 */
function resolveConstraints(
  tagName: string,
  options?: QuillResizeModuleOptions
): ResizeConstraints | undefined {
  const perTag = options?.constraintsByTag?.[tagName];
  if (!options?.constraints && !perTag) {
    return undefined;
  }
  return { ...options?.constraints, ...perTag };
}

const DEFAULT_EMBED_TAGS = ["img", "video"];

/**
 * Determines which element (if any) should become the resize target for a
 * given click. Tries `options.resolveEmbed` first — letting consumers
 * support custom wrapper elements or arbitrary embed shapes without
 * forking the library — and falls back to matching `options.embedTags`
 * (default `["img", "video"]`) against the clicked element's own tag.
 */
function resolveClickTarget(
  clickedTarget: HTMLElement,
  event: MouseEvent,
  options?: QuillResizeModuleOptions
): HTMLElement | null {
  const resolved = options?.resolveEmbed?.(clickedTarget, event);
  if (resolved) {
    return resolved;
  }
  const embedTags = options?.embedTags ?? DEFAULT_EMBED_TAGS;
  const tagName = clickedTarget?.tagName?.toLowerCase();
  return tagName && embedTags.includes(tagName) ? clickedTarget : null;
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
    const clickedTarget: HTMLElement = e.target as HTMLElement;
    const target = resolveClickTarget(clickedTarget, e as MouseEvent, options);
    if (target) {
      resizeTarge = target;
      resizePlugin = new ResizePlugin(
        target,
        container.parentElement as HTMLElement,
        {
          ...pluginOptions,
          constraints: resolveConstraints(
            target.tagName.toLowerCase(),
            options
          ),
        }
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
          constraints: resolveConstraints("iframe", options),
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
export type {
  QuillResizeModuleOptions,
  ToolbarOptions,
  ResizeModuleHandle,
  ResizeChangeEvent,
  ResizeConstraints,
  ResizeMediaAttributes,
};
