/**
 * Quill-native persistence for resize/align state.
 *
 * Historically this module persisted `width`, `height` and alignment only
 * as inline styles on the DOM node, which Quill has no knowledge of. That
 * state was lost on every `getContents()` / `setContents()` round trip
 * (see GitHub issues #13 and #14). This module registers Parchment
 * attributors and blot overrides so those three properties become part of
 * the Quill Delta itself, alongside the existing inline-style behavior
 * (kept for immediate visual feedback and for consumers that don't use the
 * Delta API at all).
 *
 * `align` is exposed under the Delta attribute name `resizeAlign` rather
 * than `align` to avoid colliding with Quill's own built-in block-level
 * `align` format (paragraph text-align), which every default Quill build
 * already registers.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const WIDTH_FORMAT = "width";
export const HEIGHT_FORMAT = "height";
export const ALIGN_FORMAT = "resizeAlign";
export const ALT_FORMAT = "alt";
export const TITLE_FORMAT = "title";
export const VIDEO_FILE_BLOT_NAME = "videoFile";

export type AlignValue = "left" | "center" | "right";

const ALIGN_VALUES: AlignValue[] = ["left", "center", "right"];

export function readAlignValue(node: HTMLElement): AlignValue | undefined {
  if (node.style.float === "left") {
    return "left";
  }
  if (node.style.float === "right") {
    return "right";
  }
  if (node.style.display === "block" && node.style.margin === "auto") {
    return "center";
  }
  return undefined;
}

export function applyAlignValue(node: HTMLElement, value?: string | null): void {
  node.style.removeProperty("float");
  node.style.removeProperty("display");
  node.style.removeProperty("margin");

  if (value === "left" || value === "right") {
    node.style.setProperty("float", value);
  } else if (value === "center") {
    node.style.setProperty("display", "block");
    node.style.setProperty("margin", "auto");
  }
}

interface ResizeAttributor {
  attrName: string;
  add(node: HTMLElement, value: unknown): boolean;
  remove(node: HTMLElement): void;
  value(node: HTMLElement): unknown;
}

function createStyleAttributor(
  Parchment: any,
  attrName: string,
  keyName: string
): ResizeAttributor {
  class ResizeStyleAttributor extends Parchment.StyleAttributor {
    constructor(name: string, key: string, options: any) {
      super(name, key, options);
    }
  }
  return new ResizeStyleAttributor(attrName, keyName, {
    scope: Parchment.Scope.INLINE,
  }) as unknown as ResizeAttributor;
}

function createAlignAttributor(Parchment: any): ResizeAttributor {
  class ResizeAlignAttributor extends Parchment.Attributor {
    constructor(name: string, key: string, options: any) {
      super(name, key, options);
    }
    add(node: HTMLElement, value: unknown): boolean {
      if (!this.canAdd(node, value)) {
        return false;
      }
      applyAlignValue(node, value as string);
      return true;
    }
    remove(node: HTMLElement): void {
      applyAlignValue(node, undefined);
    }
    value(node: HTMLElement): string | undefined {
      return readAlignValue(node);
    }
  }
  return new ResizeAlignAttributor(ALIGN_FORMAT, "align", {
    scope: Parchment.Scope.INLINE,
    whitelist: ALIGN_VALUES,
  }) as unknown as ResizeAttributor;
}

/**
 * Generic attributor for a plain HTML attribute (`alt`, `title`), used to
 * persist media-attribute edits through the Delta model. Unlike
 * `createStyleAttributor`, this reads/writes a real DOM attribute rather
 * than an inline style property.
 */
function createAttributeAttributor(
  Parchment: any,
  attrName: string,
  htmlAttr: string
): ResizeAttributor {
  class ResizeAttributeAttributor extends Parchment.Attributor {
    constructor(name: string, key: string, options: any) {
      super(name, key, options);
    }
    add(node: HTMLElement, value: unknown): boolean {
      if (!this.canAdd(node, value)) {
        return false;
      }
      node.setAttribute(htmlAttr, String(value));
      return true;
    }
    remove(node: HTMLElement): void {
      node.removeAttribute(htmlAttr);
    }
    value(node: HTMLElement): string | undefined {
      return node.getAttribute(htmlAttr) ?? undefined;
    }
  }
  return new ResizeAttributeAttributor(attrName, htmlAttr, {
    scope: Parchment.Scope.ATTRIBUTE,
  }) as unknown as ResizeAttributor;
}

function withResizeFormats(BaseBlot: any, attributors: ResizeAttributor[]) {
  return class ResizableBlot extends BaseBlot {
    static formats(domNode: HTMLElement): Record<string, unknown> {
      const formats: Record<string, unknown> =
        typeof BaseBlot.formats === "function"
          ? { ...BaseBlot.formats(domNode) }
          : {};
      attributors.forEach((attributor) => {
        const value = attributor.value(domNode);
        if (value) {
          formats[attributor.attrName] = value;
        }
      });
      return formats;
    }

    format(name: string, value: unknown): void {
      const attributor = attributors.find((item) => item.attrName === name);
      if (attributor) {
        if (value) {
          attributor.add(this.domNode, value);
        } else {
          attributor.remove(this.domNode);
        }
        return;
      }
      super.format(name, value);
    }
  };
}

/**
 * Blot for literal HTML5 `<video>` elements (self-hosted media), which
 * Quill has no built-in format for — its default `formats/video` blot
 * renders an `<iframe>` embed instead. Registered as a plain inline embed,
 * mirroring how `formats/image` behaves.
 */
function createVideoFileBlot(Parchment: any) {
  class VideoFile extends Parchment.EmbedBlot {
    static blotName = VIDEO_FILE_BLOT_NAME;
    static tagName = "VIDEO";

    static create(value: string): HTMLElement {
      const node = super.create(value) as HTMLVideoElement;
      node.setAttribute("controls", "true");
      if (typeof value === "string") {
        node.setAttribute("src", value);
      }
      return node;
    }

    static value(domNode: HTMLVideoElement): string | null {
      return domNode.getAttribute("src");
    }
  }
  return VideoFile;
}

let registered = false;

/**
 * Registers resize-aware `image`, `video` (iframe embed) and `videoFile`
 * (literal `<video>` tag) blots on the given Quill class. Idempotent: safe
 * to call once per editor instance, registration only ever happens once.
 */
export function registerResizeFormats(QuillCtor: any): void {
  if (registered || !QuillCtor?.import) {
    return;
  }

  const Parchment = QuillCtor.import("parchment");
  const attributors = [
    createStyleAttributor(Parchment, WIDTH_FORMAT, "width"),
    createStyleAttributor(Parchment, HEIGHT_FORMAT, "height"),
    createAlignAttributor(Parchment),
    createAttributeAttributor(Parchment, ALT_FORMAT, "alt"),
    createAttributeAttributor(Parchment, TITLE_FORMAT, "title"),
  ];

  const BaseImage = QuillCtor.import("formats/image");
  const BaseVideo = QuillCtor.import("formats/video");

  if (BaseImage) {
    QuillCtor.register(withResizeFormats(BaseImage, attributors), true);
  }
  if (BaseVideo) {
    QuillCtor.register(withResizeFormats(BaseVideo, attributors), true);
  }

  const VideoFileBlot = createVideoFileBlot(Parchment);
  QuillCtor.register(withResizeFormats(VideoFileBlot, attributors), true);

  registered = true;
}

/**
 * Reads the given quill instance's Parchment blot for a resize target (if
 * any) and, when found, persists the current width/height/align/alt/title
 * state into the Quill Delta via `formatText`, so they survive
 * `getContents()` / `setContents()` round trips. `alt`/`title` are read
 * from the DOM node's attributes and re-applied idempotently on every
 * call (harmless no-op when unchanged), so a single sync path covers both
 * resize/align gestures and media-attribute edits.
 *
 * No-ops when the module wasn't given a live Quill instance (e.g. when
 * `ResizePlugin` is used standalone, without Quill formats registered), or
 * when the target isn't backed by a registered blot.
 */
export function syncResizeStateToQuill(
  quill: any,
  target: HTMLElement
): void {
  if (!quill?.constructor?.find || typeof quill.getIndex !== "function") {
    return;
  }

  const blot = quill.constructor.find(target);
  if (!blot || typeof quill.formatText !== "function") {
    return;
  }

  const index = quill.getIndex(blot);
  quill.formatText(
    index,
    1,
    {
      [WIDTH_FORMAT]: target.style.width || "",
      [HEIGHT_FORMAT]: target.style.height || "",
      [ALIGN_FORMAT]: readAlignValue(target) || "",
      [ALT_FORMAT]: target.getAttribute("alt") || "",
      [TITLE_FORMAT]: target.getAttribute("title") || "",
    },
    "user"
  );
}
