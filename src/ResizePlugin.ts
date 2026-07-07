import "./ResizePlugin.less";
import { I18n, Locale, defaultLocale } from "./i18n";
import { format, getScrollParent } from "./utils";
import { syncResizeStateToQuill } from "./formats";

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
  onChange?: (element: HTMLElement) => void;
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
  [index: string]: any;
}
const template = `
<div class="handler" title="{0}"></div>
<span class="size-label"></span>
<div class="toolbar">
  <div class="group" data-group="size">
    <a class="btn" data-type="width" data-styles="width:100%">100%</a>
    <a class="btn" data-type="width" data-styles="width:50%">50%</a>
    <span class="input-wrapper"><input data-type="width" maxlength="3" /><span class="suffix">%</span><span class="tooltip">{5}</span></span>
    <a class="btn" data-type="width" data-styles="width:auto; height:auto;">{4}</a>
  </div>
  <div class="group" data-group="align">
    <a class="btn" data-type="align" data-styles="float:left">{1}</a>
    <a class="btn" data-type="align" data-styles="display:block;margin:auto;">{2}</a>
    <a class="btn" data-type="align" data-styles="float:right;">{3}</a>
    <a class="btn" data-type="align" data-styles="">{4}</a>
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
    this.onScroll = () => this.positionResizerToTarget(this.resizeTarget);
    this.bindEvents();
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
        this.i18n.findLabel("inputTip")
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
      this.resizer.addEventListener("mousedown", this.startResize);
      this.resizer.addEventListener("click", this.toolbarClick);
      this.resizer.addEventListener("change", this.toolbarInputChange);
    }
    window.addEventListener("mouseup", this.endResize);
    window.addEventListener("mousemove", this.resizing);

    // Add scroll parent detection for better positioning. The listener
    // reference is kept so destroy() can remove it again; without this the
    // scroll parent would keep a dangling reference to this instance (and
    // its DOM nodes) forever once the resizer is torn down.
    this.scrollParent = getScrollParent(this.resizeTarget);
    this.scrollParent?.addEventListener("scroll", this.onScroll);
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
  startResize(e: MouseEvent) {
    const target: HTMLElement = e.target as HTMLElement;
    if (target.classList.contains("handler") && e.which === 1) {
      this.startResizePosition = {
        left: e.clientX,
        top: e.clientY,
        width: this.resizeTarget.clientWidth,
        height: this.resizeTarget.clientHeight,
      };
    }
  }
  endResize() {
    const wasResizing = this.startResizePosition !== null;
    this.startResizePosition = null;
    if (wasResizing) {
      this._syncPersistence();
    }
    this.options?.onChange?.(this.resizeTarget);
  }
  resizing(e: MouseEvent) {
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
  }

  destroy() {
    this.container.removeChild(this.resizer as HTMLElement);
    window.removeEventListener("mouseup", this.endResize);
    window.removeEventListener("mousemove", this.resizing);
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
