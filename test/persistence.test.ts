import { afterEach, describe, expect, it, vi } from "vitest";
import Quill from "quill";
import QuillResizeModule from "../src/main";
import IframeClick from "../src/IframeClick";
import { leftButtonPointerDown, makeEditable, stubGeometry } from "./testUtils";

/**
 * Integration tests exercising the real `quill` package (not the duck-typed
 * mock used in test/main.test.ts) to verify that width/height/align set
 * through the toolbar or drag-resize actually persist through Quill's
 * Delta model — i.e. survive `getContents()` / `setContents()` round
 * trips — instead of only living as inline styles on the DOM node. This is
 * the fix for https://github.com/BOTOOM/quill-resize-module/issues/13 and
 * https://github.com/BOTOOM/quill-resize-module/issues/14.
 *
 * `QuillResizeModule` is invoked here the same way real consumers wire it
 * up: it must run *before* any content is inserted, exactly like Quill's
 * own module system does when the resize module is registered via
 * `Quill.register("modules/resize", ResizeModule)` and enabled through
 * `new Quill(el, { modules: { resize: {} } })` — Quill instantiates all
 * configured modules synchronously inside its own constructor, before the
 * caller has a chance to call `setContents()`. Calling it after content
 * already exists is not a supported order: blots created before formats
 * are registered keep using the un-enhanced base blot class.
 */

function createQuill(): { container: HTMLElement; quill: Quill } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const quill = new Quill(container);
  QuillResizeModule(quill as unknown as Parameters<typeof QuillResizeModule>[0]);
  return { container, quill };
}

function getImageOp(delta: ReturnType<Quill["getContents"]>) {
  return delta.ops.find(
    (op) => op.insert && typeof op.insert === "object" && "image" in op.insert
  );
}

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

describe("Quill-native persistence", () => {
  it("persists a toolbar width change through getContents()", () => {
    const { quill } = createQuill();
    quill.setContents([
      { insert: { image: "https://example.com/a.png" } },
    ] as unknown as Parameters<Quill["setContents"]>[0]);

    const img = quill.root.querySelector("img") as HTMLImageElement;
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const resizer = quill.root.parentElement?.querySelector(
      "#editor-resizer"
    ) as HTMLElement;
    const widthBtn = resizer.querySelector(
      '.btn[data-styles="width:50%"]'
    ) as HTMLElement;
    widthBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const op = getImageOp(quill.getContents());
    expect(op?.attributes?.width).toBe("50%");
  });

  it("persists an align change under the resizeAlign delta attribute", () => {
    const { quill } = createQuill();
    quill.setContents([
      { insert: { image: "https://example.com/a.png" } },
    ] as unknown as Parameters<Quill["setContents"]>[0]);

    const img = quill.root.querySelector("img") as HTMLImageElement;
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const resizer = quill.root.parentElement?.querySelector(
      "#editor-resizer"
    ) as HTMLElement;
    const leftBtn = resizer.querySelector(
      '.btn[data-type="align"][data-styles="float:left"]'
    ) as HTMLElement;
    leftBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const op = getImageOp(quill.getContents());
    expect(op?.attributes?.resizeAlign).toBe("left");
    // Does not collide with Quill's own block-level "align" format.
    expect(op?.attributes?.align).toBeUndefined();
  });

  it("clears the align attribute from the delta when 'none' is selected", () => {
    const { quill } = createQuill();
    quill.setContents([
      { insert: { image: "https://example.com/a.png" } },
    ] as unknown as Parameters<Quill["setContents"]>[0]);

    const img = quill.root.querySelector("img") as HTMLImageElement;
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const resizer = quill.root.parentElement?.querySelector(
      "#editor-resizer"
    ) as HTMLElement;

    resizer
      .querySelector('.btn[data-type="align"][data-styles="float:left"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(getImageOp(quill.getContents())?.attributes?.resizeAlign).toBe(
      "left"
    );

    const noneBtn = resizer.querySelector(
      '.btn[data-type="align"][data-styles=""]'
    ) as HTMLElement;
    noneBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(
      getImageOp(quill.getContents())?.attributes?.resizeAlign
    ).toBeUndefined();
  });

  it("persists width/height set via drag-resize", () => {
    const { quill } = createQuill();
    quill.setContents([
      { insert: { image: "https://example.com/a.png" } },
    ] as unknown as Parameters<Quill["setContents"]>[0]);

    const img = quill.root.querySelector("img") as HTMLImageElement;
    stubGeometry(img, { width: 100, height: 80 });
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const resizer = quill.root.parentElement?.querySelector(
      "#editor-resizer"
    ) as HTMLElement;
    const handler = resizer.querySelector(".handler") as HTMLElement;

    handler.dispatchEvent(leftButtonPointerDown({ clientX: 0, clientY: 0 }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 40, clientY: 20 }));
    window.dispatchEvent(new PointerEvent("pointerup"));

    const op = getImageOp(quill.getContents());
    expect(op?.attributes?.width).toBe("140px");
    expect(op?.attributes?.height).toBe("100px");
  });

  it("restores the visual style on a fresh Quill instance from the persisted delta", () => {
    const { quill } = createQuill();
    quill.setContents([
      { insert: { image: "https://example.com/a.png" } },
    ] as unknown as Parameters<Quill["setContents"]>[0]);

    const img = quill.root.querySelector("img") as HTMLImageElement;
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const resizer = quill.root.parentElement?.querySelector(
      "#editor-resizer"
    ) as HTMLElement;
    resizer
      .querySelector('.btn[data-styles="width:50%"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    resizer
      .querySelector('.btn[data-type="align"][data-styles="float:left"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const persistedDelta = quill.getContents();

    // A brand new editor instance, parsing the delta from scratch, proves
    // the round trip is genuinely DOM-derived and not just an in-memory
    // cache of the original formatText() call.
    const container2 = document.createElement("div");
    document.body.appendChild(container2);
    const quill2 = new Quill(container2);
    quill2.setContents(persistedDelta);

    const img2 = quill2.root.querySelector("img") as HTMLImageElement;
    expect(img2.style.width).toBe("50%");
    expect(img2.style.float).toBe("left");
  });

  it("does not affect Quill's own block-level align format for paragraphs", () => {
    const { quill } = createQuill();
    quill.setContents([{ insert: "hello\n" }] as unknown as Parameters<
      Quill["setContents"]
    >[0]);

    quill.formatLine(0, 1, "align", "center", "api");

    const contents = quill.getContents();
    expect(contents.ops[1]?.attributes?.align).toBe("center");
  });

  it("supports inserting and resizing a literal <video> tag via the videoFile format", () => {
    const { quill } = createQuill();
    quill.insertEmbed(0, "videoFile", "https://example.com/movie.mp4", "api");

    const video = quill.root.querySelector("video") as HTMLVideoElement;
    expect(video).not.toBeNull();
    expect(video.getAttribute("src")).toBe("https://example.com/movie.mp4");

    video.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const resizer = quill.root.parentElement?.querySelector(
      "#editor-resizer"
    ) as HTMLElement;
    resizer
      .querySelector('.btn[data-styles="width:50%"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const op = quill.getContents().ops.find(
      (item) =>
        item.insert &&
        typeof item.insert === "object" &&
        "videoFile" in item.insert
    );
    expect(op?.attributes?.width).toBe("50%");
  });

  it("persists width/align on Quill's own iframe-based video embed", () => {
    vi.useFakeTimers();
    const { quill } = createQuill();
    quill.insertEmbed(0, "video", "https://www.youtube.com/embed/dQw4w9WgXcQ", "api");
    quill.emitter.emit("text-change");

    const iframe = quill.root.querySelector("iframe") as HTMLIFrameElement;
    expect(iframe).not.toBeNull();

    iframe.focus();
    vi.advanceTimersByTime(IframeClick.resolution);

    const resizer = quill.root.parentElement?.querySelector(
      "#editor-resizer"
    ) as HTMLElement;
    expect(resizer).not.toBeNull();
    resizer
      .querySelector('.btn[data-styles="width:50%"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const op = quill.getContents().ops.find(
      (item) =>
        item.insert && typeof item.insert === "object" && "video" in item.insert
    );
    expect(op?.attributes?.width).toBe("50%");
  });

  it("skips persistence and only updates inline styles when the target has no backing blot", () => {
    // Regression guard: a target that isn't managed by Quill (e.g. an
    // orphaned node) must not throw when the resize plugin tries to sync.
    const { quill } = createQuill();
    const orphanImg = document.createElement("img");
    quill.root.appendChild(orphanImg);
    makeEditable(orphanImg);

    expect(() => {
      orphanImg.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const resizer = quill.root.parentElement?.querySelector(
        "#editor-resizer"
      ) as HTMLElement;
      resizer
        .querySelector('.btn[data-styles="width:50%"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }).not.toThrow();

    expect(orphanImg.style.width).toBe("50%");
  });
});
