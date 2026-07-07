import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import QuillResizeModule from "../src/main";
import IframeClick from "../src/IframeClick";

type QuillLike = Parameters<typeof QuillResizeModule>[0];
type EventHandler = (...args: unknown[]) => void;

function createQuillMock(root: HTMLElement): QuillLike & {
  emit: (event: string, ...args: unknown[]) => void;
} {
  const handlers: Record<string, EventHandler[]> = {};
  return {
    container: root.parentElement as HTMLElement,
    root,
    on(event: string, cb: EventHandler) {
      (handlers[event] ||= []).push(cb);
    },
    emit(event: string, ...args: unknown[]) {
      (handlers[event] || []).forEach((cb) => cb(...args));
    },
  };
}

function createEditor(): { wrapper: HTMLElement; root: HTMLElement } {
  const wrapper = document.createElement("div");
  const root = document.createElement("div");
  wrapper.appendChild(root);
  document.body.appendChild(wrapper);
  return { wrapper, root };
}

// IframeClick keeps module-level static state shared across the whole test
// file (it has no reset API yet). Clear it between tests so iframes/timers
// from one test don't leak into the next.
afterEach(() => {
  const staticState = IframeClick as unknown as {
    iframes: unknown[];
    interval: ReturnType<typeof setInterval> | null;
  };
  if (staticState.interval) {
    clearInterval(staticState.interval);
  }
  staticState.interval = null;
  staticState.iframes = [];
  document.body.innerHTML = "";
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("QuillResizeModule", () => {
  it("attaches a resizer overlay when an img is clicked", () => {
    const { wrapper, root } = createEditor();
    const img = document.createElement("img");
    root.appendChild(img);
    const quill = createQuillMock(root);

    QuillResizeModule(quill);
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(wrapper.querySelector("#editor-resizer")).not.toBeNull();
  });

  it("attaches a resizer overlay when a video is clicked", () => {
    const { wrapper, root } = createEditor();
    const video = document.createElement("video");
    root.appendChild(video);
    const quill = createQuillMock(root);

    QuillResizeModule(quill);
    video.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(wrapper.querySelector("#editor-resizer")).not.toBeNull();
  });

  it("ignores clicks on elements that are not img/video", () => {
    const { wrapper, root } = createEditor();
    const paragraph = document.createElement("p");
    root.appendChild(paragraph);
    const quill = createQuillMock(root);

    QuillResizeModule(quill);
    paragraph.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(wrapper.querySelector("#editor-resizer")).toBeNull();
  });

  it("destroys the resizer when clicking outside the active target", () => {
    const { wrapper, root } = createEditor();
    const img = document.createElement("img");
    const outside = document.createElement("div");
    root.appendChild(img);
    document.body.appendChild(outside);
    const quill = createQuillMock(root);

    QuillResizeModule(quill);
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(wrapper.querySelector("#editor-resizer")).not.toBeNull();

    outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(wrapper.querySelector("#editor-resizer")).toBeNull();
  });

  it("keeps the resizer when the mousedown happens inside the overlay itself", () => {
    const { wrapper, root } = createEditor();
    const img = document.createElement("img");
    root.appendChild(img);
    const quill = createQuillMock(root);

    QuillResizeModule(quill);
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const resizer = wrapper.querySelector("#editor-resizer") as HTMLElement;
    expect(resizer).not.toBeNull();

    resizer.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(wrapper.querySelector("#editor-resizer")).not.toBeNull();
  });

  describe("YouTube iframe normalization", () => {
    it("rewrites a youtube watch URL into a normalized embed src", () => {
      const { root } = createEditor();
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      root.appendChild(iframe);
      const quill = createQuillMock(root);

      QuillResizeModule(quill);
      quill.emit("text-change", {}, {}, "api");

      expect(iframe.src).toContain(
        "https://www.youtube.com/embed/dQw4w9WgXcQ"
      );
      expect(iframe.src).toContain("enablejsapi=1");
      expect(iframe.referrerPolicy).toBe("strict-origin-when-cross-origin");
      expect(iframe.allow).toContain("autoplay");
    });

    it("leaves non-youtube iframes untouched", () => {
      const { root } = createEditor();
      const iframe = document.createElement("iframe");
      iframe.src = "https://example.com/embed";
      root.appendChild(iframe);
      const quill = createQuillMock(root);

      QuillResizeModule(quill);
      quill.emit("text-change", {}, {}, "api");

      expect(iframe.src).toBe("https://example.com/embed");
    });
  });

  describe("iframe click tracking", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("creates a resizer overlay once the iframe gains focus", () => {
      const { wrapper, root } = createEditor();
      const iframe = document.createElement("iframe");
      iframe.src = "https://example.com/embed";
      root.appendChild(iframe);
      const quill = createQuillMock(root);

      QuillResizeModule(quill);
      quill.emit("text-change", {}, {}, "api");

      iframe.focus();
      vi.advanceTimersByTime(IframeClick.resolution);

      expect(wrapper.querySelector("#editor-resizer")).not.toBeNull();
    });

    it("does not re-trigger the callback while focus remains on the same iframe", () => {
      const { root } = createEditor();
      const iframe = document.createElement("iframe");
      iframe.src = "https://example.com/embed";
      root.appendChild(iframe);
      const quill = createQuillMock(root);

      QuillResizeModule(quill);
      quill.emit("text-change", {}, {}, "api");

      iframe.focus();
      vi.advanceTimersByTime(IframeClick.resolution);
      vi.advanceTimersByTime(IframeClick.resolution);
      vi.advanceTimersByTime(IframeClick.resolution);

      const state = IframeClick as unknown as {
        iframes: Array<{ hasTracked: boolean }>;
      };
      expect(state.iframes[0]?.hasTracked).toBe(true);
    });
  });
});
