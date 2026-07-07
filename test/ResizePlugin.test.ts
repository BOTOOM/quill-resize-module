import { afterEach, describe, expect, it, vi } from "vitest";
import ResizePlugin from "../src/ResizePlugin";
import { leftButtonMouseDown, makeEditable, stubGeometry } from "./testUtils";

function createContainer(): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

function createTarget(): HTMLElement {
  const img = document.createElement("img");
  return img;
}

// ResizePlugin.bindEvents() registers "mouseup"/"mousemove" listeners on
// `window` for every instance and only removes them via destroy(). Track
// every instance created in a test and destroy it afterwards, otherwise
// listeners (and their closures over `options`) leak into later tests.
let activePlugins: ResizePlugin[] = [];
function createPlugin(
  target: ConstructorParameters<typeof ResizePlugin>[0],
  container: HTMLElement,
  options?: ConstructorParameters<typeof ResizePlugin>[2]
): ResizePlugin {
  const plugin = new ResizePlugin(target, container, options);
  activePlugins.push(plugin);
  return plugin;
}

afterEach(() => {
  activePlugins.forEach((plugin) => {
    try {
      plugin.destroy();
    } catch {
      // instance already destroyed/detached in the test itself; ignore.
    }
  });
  activePlugins = [];
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("ResizePlugin", () => {
  it("creates a single #editor-resizer overlay with localized labels", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);

    createPlugin(target, container);

    const resizers = container.querySelectorAll("#editor-resizer");
    expect(resizers.length).toBe(1);
    expect(container.querySelector(".handler")).not.toBeNull();
    expect(container.textContent).toContain("Left");
    expect(container.textContent).toContain("Right");
    expect(container.textContent).toContain("Center");
    expect(container.textContent).toContain("Restore");
  });

  it("reuses the existing overlay when instantiated twice in the same container", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);

    createPlugin(target, container);
    createPlugin(target, container);

    expect(container.querySelectorAll("#editor-resizer").length).toBe(1);
  });

  it("applies custom locale labels", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);

    createPlugin(target, container, {
      locale: { floatLeft: "Izquierda", floatRight: "Derecha" },
    });

    expect(container.textContent).toContain("Izquierda");
    expect(container.textContent).toContain("Derecha");
  });

  it("positions the resizer to match the target when contentEditable", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);
    makeEditable(target);
    stubGeometry(container, { left: 10, top: 20, width: 500, height: 400 });
    stubGeometry(target, { left: 30, top: 50, width: 200, height: 100 });

    const plugin = createPlugin(target, container);

    expect(plugin.resizer?.style.left).toBe("20px");
    expect(plugin.resizer?.style.top).toBe("30px");
    expect(plugin.resizer?.style.width).toBe("200px");
    expect(plugin.resizer?.style.height).toBe("100px");
  });

  it("does not position the resizer when the target is not contentEditable", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);
    stubGeometry(target, { left: 30, top: 50, width: 200, height: 100 });

    const plugin = createPlugin(target, container);

    expect(plugin.resizer?.style.left).toBe("");
    expect(plugin.resizer?.style.top).toBe("");
  });

  it("applies a preset width style and notifies onChange when a toolbar button is clicked", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);
    const onChange = vi.fn();

    const plugin = createPlugin(target, container, { onChange });
    const button = plugin.resizer?.querySelector(
      '.btn[data-styles="width:50%"]'
    ) as HTMLElement;
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(target.style.cssText.replace(/\s/g, "")).toContain("width:50%");
    expect(onChange).toHaveBeenCalledWith(target);
  });

  it("applies an align style when an align toolbar button is clicked", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);
    const onChange = vi.fn();

    const plugin = createPlugin(target, container, { onChange });
    const leftBtn = plugin.resizer?.querySelector(
      '.btn[data-type="align"][data-styles="float:left"]'
    ) as HTMLElement;
    leftBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(target.style.cssText.replace(/\s/g, "")).toContain("float:left");
    expect(onChange).toHaveBeenCalledWith(target);
  });

  it("applies width percentage from the toolbar input", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);
    const onChange = vi.fn();

    const plugin = createPlugin(target, container, { onChange });
    const input = plugin.resizer?.querySelector(
      'input[data-type="width"]'
    ) as HTMLInputElement;
    input.value = "42";
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(target.style.cssText.replace(/\s/g, "")).toContain("width:42%");
    expect(onChange).toHaveBeenCalledWith(target);
  });

  it("ignores a non-numeric value from the toolbar input", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);
    const onChange = vi.fn();

    const plugin = createPlugin(target, container, { onChange });
    const input = plugin.resizer?.querySelector(
      'input[data-type="width"]'
    ) as HTMLInputElement;
    input.value = "not-a-number";
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(target.style.cssText).toBe("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("resizes the target based on mouse drag deltas from the handler", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);
    stubGeometry(target, { width: 100, height: 80 });

    const plugin = createPlugin(target, container);
    const handler = plugin.resizer?.querySelector(".handler") as HTMLElement;

    handler.dispatchEvent(
      leftButtonMouseDown({ clientX: 0, clientY: 0 })
    );
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 40, clientY: 20 })
    );

    expect(target.style.width).toBe("140px");
    expect(target.style.height).toBe("100px");
  });

  it("enforces a 30px minimum when shrinking below the limit", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);
    stubGeometry(target, { width: 40, height: 40 });

    const plugin = createPlugin(target, container);
    const handler = plugin.resizer?.querySelector(".handler") as HTMLElement;

    handler.dispatchEvent(
      leftButtonMouseDown({ clientX: 0, clientY: 0 })
    );
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: -100, clientY: -100 })
    );

    expect(target.style.width).toBe("30px");
    expect(target.style.height).toBe("30px");
  });

  it("preserves the original aspect ratio while resizing with the alt key held", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);
    stubGeometry(target, { width: 100, height: 50 });

    const plugin = createPlugin(target, container);
    const handler = plugin.resizer?.querySelector(".handler") as HTMLElement;

    handler.dispatchEvent(
      leftButtonMouseDown({ clientX: 0, clientY: 0 })
    );
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 100, clientY: 0, altKey: true })
    );

    // originSize ratio is height/width = 50/100 = 0.5, new width = 200
    expect(target.style.width).toBe("200px");
    expect(target.style.height).toBe("100px");
  });

  it("does nothing on mousemove before a drag has started", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);

    createPlugin(target, container);
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 999, clientY: 999 })
    );

    expect(target.style.width).toBe("");
    expect(target.style.height).toBe("");
  });

  it("calls onChange when a drag ends", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);
    const onChange = vi.fn();

    const plugin = createPlugin(target, container, { onChange });
    const handler = plugin.resizer?.querySelector(".handler") as HTMLElement;

    handler.dispatchEvent(
      leftButtonMouseDown({ clientX: 0, clientY: 0 })
    );
    window.dispatchEvent(new MouseEvent("mouseup"));

    expect(onChange).toHaveBeenCalledWith(target);
    expect(plugin.startResizePosition).toBeNull();
  });

  it("removes the overlay from the container on destroy()", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);

    const plugin = createPlugin(target, container);
    plugin.destroy();

    expect(container.querySelector("#editor-resizer")).toBeNull();
    expect(plugin.resizer).toBeNull();
  });

  it("keeps the deprecated destory() alias working for backward compatibility", () => {
    const container = createContainer();
    const target = createTarget();
    container.appendChild(target);

    const plugin = createPlugin(target, container);
    plugin.destory();

    expect(container.querySelector("#editor-resizer")).toBeNull();
    expect(plugin.resizer).toBeNull();
  });

  it("removes the scroll-parent listener on destroy() instead of leaking it", () => {
    const scrollParent = createContainer();
    scrollParent.style.overflowY = "auto";
    const container = document.createElement("div");
    scrollParent.appendChild(container);
    const target = createTarget();
    container.appendChild(target);

    const plugin = createPlugin(target, container);
    const removeSpy = vi.spyOn(scrollParent, "removeEventListener");

    plugin.destroy();

    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });

  describe("toolbar visibility options", () => {
    it("shows the toolbar and both button groups by default", () => {
      const container = createContainer();
      const target = createTarget();
      container.appendChild(target);

      const plugin = createPlugin(target, container);

      const toolbar = plugin.resizer?.querySelector(
        ".toolbar"
      ) as HTMLElement;
      const sizeGroup = plugin.resizer?.querySelector(
        '[data-group="size"]'
      ) as HTMLElement;
      const alignGroup = plugin.resizer?.querySelector(
        '[data-group="align"]'
      ) as HTMLElement;

      expect(toolbar.style.display).toBe("");
      expect(sizeGroup.style.display).toBe("");
      expect(alignGroup.style.display).toBe("");
    });

    it("hides the whole toolbar when showToolbar is false", () => {
      const container = createContainer();
      const target = createTarget();
      container.appendChild(target);

      const plugin = createPlugin(target, container, {
        showToolbar: false,
      });

      const toolbar = plugin.resizer?.querySelector(
        ".toolbar"
      ) as HTMLElement;
      expect(toolbar.style.display).toBe("none");
    });

    it("hides only the size tools when toolbar.sizeTools is false", () => {
      const container = createContainer();
      const target = createTarget();
      container.appendChild(target);

      const plugin = createPlugin(target, container, {
        toolbar: { sizeTools: false },
      });

      const sizeGroup = plugin.resizer?.querySelector(
        '[data-group="size"]'
      ) as HTMLElement;
      const alignGroup = plugin.resizer?.querySelector(
        '[data-group="align"]'
      ) as HTMLElement;
      expect(sizeGroup.style.display).toBe("none");
      expect(alignGroup.style.display).toBe("");
    });

    it("hides only the align tools when toolbar.alignTools is false", () => {
      const container = createContainer();
      const target = createTarget();
      container.appendChild(target);

      const plugin = createPlugin(target, container, {
        toolbar: { alignTools: false },
      });

      const alignGroup = plugin.resizer?.querySelector(
        '[data-group="align"]'
      ) as HTMLElement;
      expect(alignGroup.style.display).toBe("none");
    });

    it("supports the deprecated toolbar.alingTools alias", () => {
      const container = createContainer();
      const target = createTarget();
      container.appendChild(target);

      const plugin = createPlugin(target, container, {
        toolbar: { alingTools: false },
      });

      const alignGroup = plugin.resizer?.querySelector(
        '[data-group="align"]'
      ) as HTMLElement;
      expect(alignGroup.style.display).toBe("none");
    });

    it("prefers toolbar.alignTools over the deprecated alingTools alias when both are set", () => {
      const container = createContainer();
      const target = createTarget();
      container.appendChild(target);

      const plugin = createPlugin(target, container, {
        toolbar: { alignTools: true, alingTools: false },
      });

      const alignGroup = plugin.resizer?.querySelector(
        '[data-group="align"]'
      ) as HTMLElement;
      expect(alignGroup.style.display).toBe("");
    });

    it("hides the size label by default and shows it when showSize is true", () => {
      const container = createContainer();
      const target = createTarget();
      container.appendChild(target);
      makeEditable(target);
      stubGeometry(container, { left: 0, top: 0, width: 500, height: 400 });
      stubGeometry(target, { left: 0, top: 0, width: 320, height: 180 });

      const hidden = createPlugin(target, container);
      const hiddenLabel = hidden.resizer?.querySelector(
        ".size-label"
      ) as HTMLElement;
      expect(hiddenLabel.style.display).toBe("none");

      const container2 = createContainer();
      const target2 = createTarget();
      container2.appendChild(target2);
      makeEditable(target2);
      stubGeometry(container2, { left: 0, top: 0, width: 500, height: 400 });
      stubGeometry(target2, { left: 0, top: 0, width: 320, height: 180 });

      const shown = createPlugin(target2, container2, { showSize: true });
      const shownLabel = shown.resizer?.querySelector(
        ".size-label"
      ) as HTMLElement;
      expect(shownLabel.style.display).toBe("");
      expect(shownLabel.textContent).toBe("320 x 180");
    });
  });
});
