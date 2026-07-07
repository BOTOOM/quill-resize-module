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
    off(event: string, cb: EventHandler) {
      handlers[event] = (handlers[event] || []).filter((item) => item !== cb);
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

  it("propagates onSelect through to the module-level API when an img is clicked", () => {
    const { root } = createEditor();
    const img = document.createElement("img");
    root.appendChild(img);
    const quill = createQuillMock(root);
    const onSelect = vi.fn();

    QuillResizeModule(quill, { onSelect });
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(onSelect).toHaveBeenCalledWith(img);
  });

  it("applies constraintsByTag for the clicked target's tag", () => {
    const { wrapper, root } = createEditor();
    const img = document.createElement("img");
    root.appendChild(img);
    Object.defineProperty(img, "clientWidth", {
      configurable: true,
      value: 100,
    });
    Object.defineProperty(img, "clientHeight", {
      configurable: true,
      value: 80,
    });
    const quill = createQuillMock(root);

    QuillResizeModule(quill, {
      constraintsByTag: { img: { maxWidth: 120 }, video: { maxWidth: 9999 } },
    });
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const handler = wrapper.querySelector(".handler") as HTMLElement;
    handler.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 1,
        clientX: 0,
        clientY: 0,
      })
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 500, clientY: 500 })
    );

    expect(img.style.width).toBe("120px");
  });

  it("attaches a resizer overlay for a custom embedTags entry and not for tags outside it", () => {
    const { wrapper, root } = createEditor();
    const custom = document.createElement("canvas");
    const img = document.createElement("img");
    root.appendChild(custom);
    root.appendChild(img);
    const quill = createQuillMock(root);

    const handle = QuillResizeModule(quill, { embedTags: ["canvas"] });
    custom.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(wrapper.querySelector("#editor-resizer")).not.toBeNull();
    handle.destroy();
    expect(wrapper.querySelector("#editor-resizer")).toBeNull();

    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(wrapper.querySelector("#editor-resizer")).toBeNull();
  });

  it("uses resolveEmbed to resize a custom wrapper element instead of the clicked child", () => {
    const { wrapper, root } = createEditor();
    const figure = document.createElement("figure");
    figure.className = "my-embed";
    const span = document.createElement("span");
    figure.appendChild(span);
    root.appendChild(figure);
    const quill = createQuillMock(root);
    const resolveEmbed = vi.fn((clickedTarget: HTMLElement) =>
      clickedTarget.closest<HTMLElement>(".my-embed")
    );

    QuillResizeModule(quill, { resolveEmbed });
    span.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(resolveEmbed).toHaveBeenCalled();
    expect(wrapper.querySelector("#editor-resizer")).not.toBeNull();
  });

  it("falls back to embedTags matching when resolveEmbed returns nothing", () => {
    const { wrapper, root } = createEditor();
    const img = document.createElement("img");
    root.appendChild(img);
    const quill = createQuillMock(root);
    const resolveEmbed = vi.fn(() => null);

    QuillResizeModule(quill, { resolveEmbed });
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(resolveEmbed).toHaveBeenCalled();
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

  it("destroys the resizer when a pointerdown happens outside the active target", () => {
    const { wrapper, root } = createEditor();
    const img = document.createElement("img");
    const outside = document.createElement("div");
    root.appendChild(img);
    document.body.appendChild(outside);
    const quill = createQuillMock(root);

    QuillResizeModule(quill);
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(wrapper.querySelector("#editor-resizer")).not.toBeNull();

    outside.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(wrapper.querySelector("#editor-resizer")).toBeNull();
  });

  it("keeps the resizer when the pointerdown happens inside the overlay itself", () => {
    const { wrapper, root } = createEditor();
    const img = document.createElement("img");
    root.appendChild(img);
    const quill = createQuillMock(root);

    QuillResizeModule(quill);
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const resizer = wrapper.querySelector("#editor-resizer") as HTMLElement;
    expect(resizer).not.toBeNull();

    resizer.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

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

  describe("destroy()", () => {
    it("stops reacting to clicks on media elements", () => {
      const { wrapper, root } = createEditor();
      const img = document.createElement("img");
      root.appendChild(img);
      const quill = createQuillMock(root);

      const handle = QuillResizeModule(quill);
      handle.destroy();
      img.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(wrapper.querySelector("#editor-resizer")).toBeNull();
    });

    it("removes the active resizer overlay, if any, when called", () => {
      const { wrapper, root } = createEditor();
      const img = document.createElement("img");
      root.appendChild(img);
      const quill = createQuillMock(root);

      const handle = QuillResizeModule(quill);
      img.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(wrapper.querySelector("#editor-resizer")).not.toBeNull();

      handle.destroy();

      expect(wrapper.querySelector("#editor-resizer")).toBeNull();
    });

    it("stops tracking iframes registered via text-change, freeing the shared polling interval", () => {
      const { root } = createEditor();
      const iframe = document.createElement("iframe");
      iframe.src = "https://example.com/embed";
      root.appendChild(iframe);
      const quill = createQuillMock(root);

      const handle = QuillResizeModule(quill);
      quill.emit("text-change", {}, {}, "api");

      const state = IframeClick as unknown as {
        iframes: unknown[];
        interval: ReturnType<typeof setInterval> | null;
      };
      expect(state.iframes.length).toBe(1);

      handle.destroy();

      expect(state.iframes.length).toBe(0);
      expect(state.interval).toBeNull();
    });

    it("stops reacting to further text-change events after destroy", () => {
      const { root } = createEditor();
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      root.appendChild(iframe);
      const quill = createQuillMock(root);

      const handle = QuillResizeModule(quill);
      handle.destroy();
      quill.emit("text-change", {}, {}, "api");

      // No normalization should have run since the listener was removed.
      expect(iframe.src).toBe(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      );
    });
  });
});
