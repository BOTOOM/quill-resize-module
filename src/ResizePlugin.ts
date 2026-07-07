import "./ResizePlugin.less";
import { I18n, Locale, defaultLocale } from "./i18n";
import { format, getScrollParent } from "./utils";
import { syncResizeStateToQuill, readAlignValue, AlignValue } from "./formats";

interface Size {
  width: number;
  height: number;
}
interface Position {
  left: number;
  top: number;
  width: number;
  height: number;
}
class ResizeElement extends HTMLElement {
  public originSize?: Size | null = null;
  [key: string]: any;
}

/**
 * Structured payload passed to the resize/align callbacks below, so
 * consumers get typed width/height/align data instead of having to read
 * `element.style` themselves.
 */
interface ResizeChangeEvent {
  target: HTMLElement;
  width: number;
  height: number;
  align: AlignValue | null;
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

interface ResizePluginOption {
  locale?: Locale;
  /**
   * Fired after every change (drag, keyboard resize, toolbar click/input).
   * Kept for backward compatibility; prefer the more specific callbacks
   * below (onResizeStart/onResize/onResizeEnd/onAlignChange) for new code.
   */
  onChange?: (element: HTMLElement) => void;
  /** Fired once when the overlay activates for a new target. */
  onSelect?: (element: HTMLElement) => void;
  /** Fired when a resize gesture begins (pointer drag or keyboard step). */
  onResizeStart?: (element: HTMLElement) => void;
  /**
   * Fired during a resize gesture with the current width/height/align.
   * For pointer drags this fires on every pointermove; for keyboard/toolbar
   * driven resizes (which have no separate "in progress" state) it fires
   * once with the final size.
   */
  onResize?: (element: HTMLElement, event: ResizeChangeEvent) => void;
  /** Fired when a resize gesture ends. */
  onResizeEnd?: (element: HTMLElement) => void;
  /** Fired specifically when the alignment (left/center/right/none) changes. */
  onAlignChange?: (element: HTMLElement, align: AlignValue | null) => void;
  /** Show/hide the whole floating toolbar. Default: true. */
  showToolbar?: boolean;
  /** Display the current width/height as a small label. Default: false. */
  showSize?: boolean;
  toolbar?: ToolbarOptions;
  /**
   * Live Quill instance, used internally to persist width/height/align
   * through the Delta model. Set automatically by QuillResizeModule; not
   * meant to be provided directly by consumers.
   */
  __quillInstance?: any;
  /**
   * Internal only: whether to move focus onto the resize handle once the
   * overlay activates. Set to `false` by QuillResizeModule for iframes
   * tracked via IframeClick's focus-polling loop, since that loop uses
   * `document.activeElement === iframe` to detect the iframe is still
   * active — auto-focusing the handle would immediately look like a focus
   * loss to it. Not meant to be provided directly by consumers.
   */
  __autoFocus?: boolean;
  [index: string]: any;
}
const template = `
<button type="button" class="handler" title="{0}" aria-label="{6}"></button>
<span class="size-label" aria-hidden="true"></span>
<div class="toolbar" role="toolbar" aria-label="{7}">
  <div class="group" data-group="size">
    <button type="button" class="btn" data-type="width" data-styles="width:100%">100%</button>
    <button type="button" class="btn" data-type="width" data-styles="width:50%">50%</button>
    <span class="input-wrapper"><input type="text" data-type="width" maxlength="3" aria-label="{5}" /><span class="suffix">%</span><span class="tooltip">{5}</span></span>
    <button type="button" class="btn" data-type="width" data-styles="width:auto; height:auto;">{4}</button>
  </div>
  <div class="group" data-group="align">
    <button type="button" class="btn" data-type="align" data-styles="float:left">{1}</button>
    <button type="button" class="btn" data-type="align" data-styles="display:block;margin:auto;">{2}</button>
    <button type="button" class="btn" data-type="align" data-styles="float:right;">{3}</button>
    <button type="button" class="btn" data-type="align" data-styles="">{4}</button>
  </div>
</div>
`;
class ResizePlugin {
  resizeTarget: ResizeElement;
  resizer: HTMLElement | null = null;
  container: HTMLElement;
  startResizePosition: Position | null = null;
  i18n: I18n;
  options: any;
  private scrollParent: Element | null = null;
  private onScroll: () => void;
  private activePointerId: number | null = null;

  constructor(
    resizeTarget: ResizeElement,
    container: HTMLElement,
    options?: ResizePluginOption
  ) {
    this.i18n = new I18n(options?.locale || defaultLocale);
    this.options = options;
    this.resizeTarget = resizeTarget;
    if (!resizeTarget.originSize) {
      resizeTarget.originSize = {
        width: resizeTarget.clientWidth,
        height: resizeTarget.clientHeight,
      };
    }

    this.container = container;
    this.initResizer();
    this.positionResizerToTarget(resizeTarget);

    this.resizing = this.resizing.bind(this);
    this.endResize = this.endResize.bind(this);
    this.startResize = this.startResize.bind(this);
    this.toolbarClick = this.toolbarClick.bind(this);
    this.toolbarInputChange = this.toolbarInputChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onScroll = () => this.positionResizerToTarget(this.resizeTarget);
    this.bindEvents();

    // Move focus onto the resize handle whenever the overlay activates
    // (or re-targets), so a keyboard user who reached it — via a click, or
    // via Tab if it was already open — can immediately resize with the
    // arrow keys instead of being stuck needing a mouse.
    if (this.options?.__autoFocus !== false) {
      this.resizer
        ?.querySelector<HTMLElement>(".handler")
        ?.focus?.({ preventScroll: true });
    }

    this.options?.onSelect?.(resizeTarget);
  }

  /**
   * Builds the typed payload passed to onResize/onAlignChange, reading the
   * target's current width/height/align directly from the DOM so it always
   * reflects the latest state (including changes made outside this class).
   */
  _buildChangeEvent(): ResizeChangeEvent {
    return {
      target: this.resizeTarget,
      width: this.resizeTarget.clientWidth,
      height: this.resizeTarget.clientHeight,
      align: readAlignValue(this.resizeTarget) ?? null,
    };
  }

  initResizer() {
    let resizer: HTMLElement | null =
      this.container.querySelector("#editor-resizer");
    if (!resizer) {
      resizer = document.createElement("div");
      resizer.setAttribute("id", "editor-resizer");
      resizer.innerHTML = format(
        template,
        this.i18n.findLabel("altTip"),
        this.i18n.findLabel("floatLeft"),
        this.i18n.findLabel("center"),
        this.i18n.findLabel("floatRight"),
        this.i18n.findLabel("restore"),
        this.i18n.findLabel("inputTip"),
        this.i18n.findLabel("handlerLabel"),
        this.i18n.findLabel("toolbarLabel")
      );
      this.container.appendChild(resizer);
    }
    this.resizer = resizer;
    this.applyToolbarVisibility();
  }
  /**
   * Applies the showToolbar/toolbar.sizeTools/toolbar.alignTools options
   * to the overlay markup. Re-run on every initResizer() call (not just on
   * first creation) since the overlay element may be reused across
   * activations of the same ResizePlugin/QuillResizeModule instance.
   */
  applyToolbarVisibility() {
    if (!this.resizer) {
      return;
    }
    const showToolbar = this.options?.showToolbar !== false;
    const toolbarOptions: ToolbarOptions = this.options?.toolbar || {};
    const showSizeTools = toolbarOptions.sizeTools !== false;
    // `alingTools` is the deprecated (misspelled) alias for `alignTools`;
    // prefer the corrected name when both are provided.
    const showAlignTools =
      toolbarOptions.alignTools ?? toolbarOptions.alingTools ?? true;

    const toolbar = this.resizer.querySelector(".toolbar") as HTMLElement;
    if (toolbar) {
      toolbar.style.display = showToolbar ? "" : "none";
    }
    const sizeGroup = this.resizer.querySelector(
      '[data-group="size"]'
    ) as HTMLElement;
    if (sizeGroup) {
      sizeGroup.style.display = showSizeTools ? "" : "none";
    }
    const alignGroup = this.resizer.querySelector(
      '[data-group="align"]'
    ) as HTMLElement;
    if (alignGroup) {
      alignGroup.style.display = showAlignTools ? "" : "none";
    }

    const sizeLabel = this.resizer.querySelector(
      ".size-label"
    ) as HTMLElement;
    if (sizeLabel) {
      sizeLabel.style.display = this.options?.showSize ? "" : "none";
    }
  }
  positionResizerToTarget(el: HTMLElement) {
    if (this.resizer !== null) {
      // Check if element is contentEditable before proceeding
      if (!el.isContentEditable) {
        return;
      }

      // Use getBoundingClientRect for more accurate positioning
      const containerRect = this.container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      
      this.resizer.style.setProperty(
        "left",
        elRect.left - containerRect.left + "px"
      );
      this.resizer.style.setProperty(
        "top",
        elRect.top - containerRect.top + "px"
      );

      this.resizer.style.setProperty("width", el.clientWidth + "px");
      this.resizer.style.setProperty("height", el.clientHeight + "px");

      if (this.options?.showSize) {
        const sizeLabel = this.resizer.querySelector(
          ".size-label"
        ) as HTMLElement;
        if (sizeLabel) {
          sizeLabel.textContent = `${Math.round(el.clientWidth)} x ${Math.round(
            el.clientHeight
          )}`;
        }
      }

      // Add responsive classes based on element size
      const toolbar = this.resizer.querySelector('.toolbar') as HTMLElement;
      if (toolbar) {
        // Remove existing responsive classes
        toolbar.classList.remove('small-object', 'very-small-object');
        
        // Add appropriate class based on width
        if (el.clientWidth < 150) {
          toolbar.classList.add('very-small-object');
        } else if (el.clientWidth < 250) {
          toolbar.classList.add('small-object');
        }
        
        // Add data-full-text attributes for tooltips
        const buttons = toolbar.querySelectorAll('.btn');
        buttons.forEach(btn => {
          const button = btn as HTMLElement;
          if (button.scrollWidth > button.clientWidth) {
            button.dataset.fullText = button.textContent || '';
          }
        });
      }
    }
  }

  bindEvents() {
    if (this.resizer !== null) {
      // Pointer events unify mouse, touch, and pen input behind a single
      // API (no separate touchstart/touchmove/touchend handlers needed),
      // and fire immediately for touch (unlike "click", which historically
      // waits for touchend on some browsers).
      this.resizer.addEventListener("pointerdown", this.startResize);
      this.resizer.addEventListener("click", this.toolbarClick);
      this.resizer.addEventListener("change", this.toolbarInputChange);
      this.resizer.addEventListener("keydown", this.onKeyDown);
    }
    window.addEventListener("pointerup", this.endResize);
    window.addEventListener("pointercancel", this.endResize);
    window.addEventListener("pointermove", this.resizing);

    // Add scroll parent detection for better positioning. The listener
    // reference is kept so destroy() can remove it again; without this the
    // scroll parent would keep a dangling reference to this instance (and
    // its DOM nodes) forever once the resizer is torn down.
    this.scrollParent = getScrollParent(this.resizeTarget);
    this.scrollParent?.addEventListener("scroll", this.onScroll);
  }
  /**
   * Keyboard equivalent of dragging the resize handle, so the overlay can
   * be operated without a mouse/touch pointer once it has focus:
   *  - Arrow keys resize by a small step (bigger with Shift held).
   *  - Alt+Arrow preserves the original aspect ratio, mirroring the
   *    existing Alt-drag behavior.
   *  - "0" restores the original size (same action as the toolbar's
   *    restore button).
   *  - Escape closes the overlay, by simulating the same "pointerdown
   *    outside the target" interaction that main.ts already listens for
   *    and uses to tear the overlay down — reusing that single, tested
   *    code path instead of duplicating close/cleanup logic here.
   */
  onKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("handler")) {
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      return;
    }

    if (e.key === "0") {
      e.preventDefault();
      this._setStylesForToolbar("width", "width:auto; height:auto;");
      return;
    }

    const arrowDeltas: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const delta = arrowDeltas[e.key];
    if (!delta) {
      return;
    }
    e.preventDefault();

    const step = e.shiftKey ? 10 : 1;
    const width = this.resizeTarget.clientWidth + delta[0] * step;
    let height = this.resizeTarget.clientHeight + delta[1] * step;

    if (e.altKey) {
      const originSize = this.resizeTarget.originSize as Size;
      const rate: number = originSize.height / originSize.width;
      height = rate * width;
    }

    this.resizeTarget.style.setProperty("width", Math.max(width, 30) + "px");
    this.resizeTarget.style.setProperty(
      "height",
      Math.max(height, 30) + "px"
    );
    this.positionResizerToTarget(this.resizeTarget);
    this._syncPersistence();
    // Each keystroke is a complete, atomic resize gesture (there's no
    // natural discrete "gesture end" signal for individual keypresses like
    // there is for pointer drags), so start/resize/end all fire together.
    this.options?.onResizeStart?.(this.resizeTarget);
    this.options?.onResize?.(this.resizeTarget, this._buildChangeEvent());
    this.options?.onResizeEnd?.(this.resizeTarget);
    this.options?.onChange?.(this.resizeTarget);
  }
  _setStylesForToolbar(type: string, styles: string | undefined) {
    const storeKey = `_styles_${type}`;
    const style: CSSStyleDeclaration = this.resizeTarget.style;
    const originStyles = this.resizeTarget[storeKey];
    style.cssText =
      style.cssText.replaceAll(" ", "").replace(originStyles, "") +
      `;${styles}`;
    this.resizeTarget[storeKey] = styles;

    this.positionResizerToTarget(this.resizeTarget);
    this._syncPersistence();

    if (type === "align") {
      this.options?.onAlignChange?.(
        this.resizeTarget,
        readAlignValue(this.resizeTarget) ?? null
      );
    } else {
      // Toolbar-driven width changes (presets or restore) are a discrete
      // resize with no separate "in progress" state, so start/resize/end
      // all fire together, mirroring the keyboard-shortcut resize below.
      this.options?.onResizeStart?.(this.resizeTarget);
      this.options?.onResize?.(this.resizeTarget, this._buildChangeEvent());
      this.options?.onResizeEnd?.(this.resizeTarget);
    }
    this.options?.onChange?.(this.resizeTarget);
  }
  /**
   * Persists the current width/height/align inline styles into the Quill
   * Delta (when a live Quill instance was provided via options), so they
   * survive getContents()/setContents() round trips instead of only living
   * as inline styles on the DOM node.
   */
  _syncPersistence() {
    const quill = this.options?.__quillInstance;
    if (quill) {
      syncResizeStateToQuill(quill, this.resizeTarget);
    }
  }
  toolbarInputChange(e: Event) {
    const target: HTMLInputElement = e.target as HTMLInputElement;
    const type = target?.dataset?.type;
    const value = target.value;
    if (type && Number(value)) {
      this._setStylesForToolbar(type, `width: ${Number(value)}%;`);
    }
  }
  toolbarClick(e: MouseEvent) {
    const target: HTMLElement = e.target as HTMLElement;
    const type = target?.dataset?.type;

    if (type && target.classList.contains("btn")) {
      this._setStylesForToolbar(type, target?.dataset?.styles);
    }
  }
  startResize(e: PointerEvent) {
    const target: HTMLElement = e.target as HTMLElement;
    // `button === 0` matches both the primary mouse button and the primary
    // contact point for touch/pen pointers (their `button` is 0 on
    // pointerdown), so this single check replaces the old mouse-only
    // `e.which === 1` test.
    if (target.classList.contains("handler") && e.button === 0) {
      this.startResizePosition = {
        left: e.clientX,
        top: e.clientY,
        width: this.resizeTarget.clientWidth,
        height: this.resizeTarget.clientHeight,
      };
      this.activePointerId = e.pointerId;
      // Pointer capture keeps subsequent pointermove/pointerup events
      // targeted correctly even if the finger/cursor leaves the small
      // handler hit area mid-drag — important on touch screens where fast
      // drags easily overshoot a 10px handle. Not implemented in jsdom, so
      // this is feature-detected rather than called unconditionally.
      if (typeof target.setPointerCapture === "function") {
        target.setPointerCapture(e.pointerId);
      }
      this.options?.onResizeStart?.(this.resizeTarget);
    }
  }
  endResize(e?: PointerEvent) {
    const wasResizing = this.startResizePosition !== null;
    this.startResizePosition = null;
    if (
      e &&
      this.activePointerId !== null &&
      typeof (e.target as HTMLElement)?.releasePointerCapture === "function"
    ) {
      try {
        (e.target as HTMLElement).releasePointerCapture(this.activePointerId);
      } catch {
        // Ignore — capture may already have been released by the browser
        // (e.g. on pointercancel) before we get here.
      }
    }
    this.activePointerId = null;
    if (wasResizing) {
      this._syncPersistence();
      this.options?.onResizeEnd?.(this.resizeTarget);
    }
    this.options?.onChange?.(this.resizeTarget);
  }
  resizing(e: PointerEvent) {
    if (!this.startResizePosition) return;

    const deltaX: number = e.clientX - this.startResizePosition.left;
    const deltaY: number = e.clientY - this.startResizePosition.top;
    let width = this.startResizePosition.width;
    let height = this.startResizePosition.height;
    width += deltaX;
    height += deltaY;

    if (e.altKey) {
      const originSize = this.resizeTarget.originSize as Size;
      const rate: number = originSize.height / originSize.width;
      height = rate * width;
    }

    this.resizeTarget.style.setProperty("width", Math.max(width, 30) + "px");
    this.resizeTarget.style.setProperty("height", Math.max(height, 30) + "px");
    this.positionResizerToTarget(this.resizeTarget);
    this.options?.onResize?.(this.resizeTarget, this._buildChangeEvent());
  }

  destroy() {
    this.container.removeChild(this.resizer as HTMLElement);
    window.removeEventListener("pointerup", this.endResize);
    window.removeEventListener("pointercancel", this.endResize);
    window.removeEventListener("pointermove", this.resizing);
    this.scrollParent?.removeEventListener("scroll", this.onScroll);
    this.scrollParent = null;
    this.resizer = null;
  }

  /**
   * @deprecated Use destroy() instead. Kept as an alias for backward
   * compatibility with any code calling the previous (misspelled) method
   * name directly.
   */
  destory() {
    this.destroy();
  }
}

export default ResizePlugin;
export type { ResizeChangeEvent };
