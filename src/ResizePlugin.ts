import "./ResizePlugin.less";
import { I18n, Locale, defaultLocale } from "./i18n";
import { format, getScrollParent } from "./utils";

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

interface ResizePluginOption {
  locale?: Locale;
  onChange?: (element: HTMLElement) => void;
  [index: string]: any;
}
const template = `
<div class="handler" title="{0}"></div>
<div class="toolbar">
  <div class="group">
    <a class="btn" data-type="width" data-styles="width:100%">100%</a>
    <a class="btn" data-type="width" data-styles="width:50%">50%</a>
    <span class="input-wrapper"><input data-type="width" maxlength="3" /><span class="suffix">%</span><span class="tooltip">{5}</span></span>
    <a class="btn" data-type="width" data-styles="width:auto; height:auto;">{4}</a>
  </div>
  <div class="group">
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

    // Add scroll parent detection for better positioning
    getScrollParent(this.resizeTarget)?.addEventListener("scroll", () => {
      this.positionResizerToTarget(this.resizeTarget);
    });
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
    this.options?.onChange(this.resizeTarget);
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
    this.startResizePosition = null;
    this.options?.onChange(this.resizeTarget);
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

  destory() {
    this.container.removeChild(this.resizer as HTMLElement);
    window.removeEventListener("mouseup", this.endResize);
    window.removeEventListener("mousemove", this.resizing);
    this.resizer = null;
  }
}

export default ResizePlugin;
