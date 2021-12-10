(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.QuillResizeModule = factory());
}(this, (function () { 'use strict';

    function __$styleInject(css) {
        if (!css) return;

        if (typeof window == 'undefined') return;
        var style = document.createElement('style');
        style.setAttribute('media', 'screen');

        style.innerHTML = css;
        document.head.appendChild(style);
        return css;
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    __$styleInject("#editor-resizer {\n  position: absolute;\n  border: 1px dashed #fff;\n  background-color: rgba(0, 0, 0, 0.5);\n}\n#editor-resizer .handler {\n  position: absolute;\n  right: -5px;\n  bottom: -5px;\n  width: 10px;\n  height: 10px;\n  border: 1px solid #333;\n  background-color: rgba(255, 255, 255, 0.8);\n  cursor: nwse-resize;\n  user-select: none;\n}\n#editor-resizer .toolbar {\n  position: absolute;\n  top: -3em;\n  left: 50%;\n  padding: 0.5em;\n  border: 1px solid #fff;\n  border-radius: 3px;\n  background-color: #fff;\n  box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);\n  transform: translateX(-50%);\n}\n#editor-resizer .toolbar .group {\n  display: flex;\n  border: 1px solid #aaa;\n  border-radius: 6px;\n  overflow: hidden;\n  white-space: nowrap;\n  text-align: center;\n}\n#editor-resizer .toolbar .group:not(:first-child) {\n  margin-top: 0.5em;\n}\n#editor-resizer .toolbar .group .btn {\n  flex: 1 0 0;\n  text-align: center;\n  width: 25%;\n  padding: 0 0.5rem;\n  display: inline-block;\n  color: rgba(0, 0, 0, 0.65);\n  vertical-align: top;\n  line-height: 2;\n  user-select: none;\n}\n#editor-resizer .toolbar .group .btn.btn-group {\n  padding: 0;\n  display: inline-flex;\n  line-height: 2em;\n}\n#editor-resizer .toolbar .group .btn.btn-group .inner-btn {\n  flex: 1 0 0;\n  font-size: 2em;\n  width: 50%;\n  cursor: pointer;\n}\n#editor-resizer .toolbar .group .btn.btn-group .inner-btn:first-child {\n  border-right: 1px solid #ddd;\n}\n#editor-resizer .toolbar .group .btn.btn-group .inner-btn:active {\n  transform: scale(0.8);\n}\n#editor-resizer .toolbar .group .btn:not(:last-child) {\n  border-right: 1px solid #bbb;\n}\n#editor-resizer .toolbar .group .btn:not(.btn-group):active {\n  background-color: rgba(0, 0, 0, 0.1);\n}\n#editor-resizer .last-item {\n  margin-right: 5px;\n}\n#editor-resizer .showSize {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  padding: 0.1em;\n  border: 1px solid rgba(255, 255, 255, 0.8);\n  border-radius: 2px;\n  background-color: rgba(255, 255, 255, 0.8);\n  box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);\n  transform: translateX(-50%);\n}\n");

    var I18n = /** @class */ (function () {
        function I18n(config) {
            this.config = __assign(__assign({}, defaultLocale), config);
        }
        I18n.prototype.findLabel = function (key) {
            if (this.config) {
                return Reflect.get(this.config, key);
            }
            return null;
        };
        return I18n;
    }());
    var defaultLocale = {
        altTip: "Hold down the alt key to zoom",
        floatLeft: "Left",
        floatRight: "Right",
        center: "Center",
        restore: "Restore",
    };

    function format(str) {
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        return str.replace(/\{(\d+)\}/g, function (match, index) {
            if (values.length > index) {
                return values[index];
            }
            else {
                return "";
            }
        });
    }

    var ResizeElement = /** @class */ (function (_super) {
        __extends(ResizeElement, _super);
        function ResizeElement() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.originSize = null;
            return _this;
        }
        return ResizeElement;
    }(HTMLElement));
    var templateUsed;
    var pluginOptions;
    var ResizePlugin = /** @class */ (function () {
        function ResizePlugin(resizeTarget, container, options) {
            this.resizer = null;
            this.startResizePosition = null;
            this.i18n = new I18n((options === null || options === void 0 ? void 0 : options.locale) || defaultLocale);
            templateUsed = this.createToobar(options);
            this.resizeTarget = resizeTarget;
            if (!resizeTarget.originSize) {
                resizeTarget.originSize = {
                    width: resizeTarget.clientWidth,
                    height: resizeTarget.clientHeight,
                };
            }
            pluginOptions = options;
            this.container = container;
            this.initResizer();
            this.positionResizerToTarget(resizeTarget);
            this.resizing = this.resizing.bind(this);
            this.endResize = this.endResize.bind(this);
            this.startResize = this.startResize.bind(this);
            this.toolbarClick = this.toolbarClick.bind(this);
            this.bindEvents();
        }
        ResizePlugin.prototype.initResizer = function () {
            var resizer = this.container.querySelector("#editor-resizer");
            if (!resizer) {
                resizer = document.createElement("div");
                resizer.setAttribute("id", "editor-resizer");
                resizer.innerHTML = format(templateUsed, this.i18n.findLabel("altTip"), this.i18n.findLabel("floatLeft"), this.i18n.findLabel("center"), this.i18n.findLabel("floatRight"), this.i18n.findLabel("restore"));
                this.container.appendChild(resizer);
            }
            this.resizer = resizer;
        };
        ResizePlugin.prototype.createToobar = function (options) {
            var _a, _b;
            var templateBasicToolbar = "<div class=\"handler\" title=\"{0}\"></div>";
            var size = "<div class=\"showSize\" name=\"ql-size\" title=\"{0}\">{size}</div>";
            var sizeTools = "<div class=\"group\">\n      <a class=\"btn\" data-width=\"100%\">100%</a>\n      <a class=\"btn\" data-width=\"50%\">50%</a>\n      <a  class=\"btn btn-group\">\n      <span data-width=\"-5\" class=\"inner-btn\">\uFE63</span>\n      <span data-width=\"5\" class=\"inner-btn\">\uFE62</span>\n      </a>\n      <a data-width=\"auto\" class=\"btn last-item\">{4}</a>\n      </div>";
            var alingTools = "<div class=\"group\">\n      <a class=\"btn\" data-float=\"left\">{1}</a>\n      <a class=\"btn\" data-float=\"center\">{2}</a>\n      <a class=\"btn\" data-float=\"right\">{3}</a>\n      <a data-float=\"none\" class=\"btn last-item\">{4}</a>\n      </div>";
            var toolBarTemplate = "<div class=\"toolbar\">\n    " + (((_a = options === null || options === void 0 ? void 0 : options.toolbar) === null || _a === void 0 ? void 0 : _a.sizeTools) !== false ? sizeTools : "") + "\n    " + (((_b = options === null || options === void 0 ? void 0 : options.toolbar) === null || _b === void 0 ? void 0 : _b.alingTools) !== false ? alingTools : "") + "\n  </div>";
            return "" + templateBasicToolbar + ((options === null || options === void 0 ? void 0 : options.showSize) === true ? size : "") + ((options === null || options === void 0 ? void 0 : options.showToolbar) !== false ? toolBarTemplate : "");
        };
        ResizePlugin.prototype.positionResizerToTarget = function (el) {
            if (this.resizer !== null) {
                this.resizer.style.setProperty("left", el.offsetLeft + "px");
                this.resizer.style.setProperty("top", el.offsetTop + "px");
                this.resizer.style.setProperty("width", el.clientWidth + "px");
                this.resizer.style.setProperty("height", el.clientHeight + "px");
                // this.resizer.getElementsByTagName("ql-size").item(0)?.innerHTML = `450px, 500px`
                (pluginOptions === null || pluginOptions === void 0 ? void 0 : pluginOptions.showSize) &&
                    (document.getElementsByName("ql-size").item(0).innerHTML = (el.getAttribute("width") ? el.getAttribute("width") : el.clientWidth) + ", " + (el.getAttribute("height")
                        ? el.getAttribute("height")
                        : el.clientHeight));
                // this.resizer.innerHTML = formatSize (templateUsed, "450px, 500px")
            }
        };
        ResizePlugin.prototype.bindEvents = function () {
            if (this.resizer !== null) {
                this.resizer.addEventListener("mousedown", this.startResize);
                this.resizer.addEventListener("click", this.toolbarClick);
            }
            window.addEventListener("mouseup", this.endResize);
            window.addEventListener("mousemove", this.resizing);
        };
        ResizePlugin.prototype.toolbarClick = function (e) {
            var target = e.target;
            if (target.classList.contains("btn") ||
                target.classList.contains("inner-btn")) {
                var width = target.dataset.width;
                var float = target.dataset.float;
                var style = this.resizeTarget.style;
                if (width) {
                    if (this.resizeTarget.tagName.toLowerCase() !== "iframe") {
                        // style.removeProperty("height");
                        this.resizeTarget.removeAttribute("height");
                    }
                    if (width === "auto") {
                        // style.removeProperty("width");
                        this.resizeTarget.removeAttribute("width");
                    }
                    else if (width.includes("%")) {
                        this.resizeTarget.setAttribute("width", width);
                        // style.setProperty("width", width);
                    }
                    else {
                        var styleWidth = this.resizeTarget.getAttribute("width") || "";
                        // let styleWidth = style.getPropertyValue("width");
                        width = parseInt(width);
                        if (styleWidth.includes("%")) {
                            styleWidth =
                                Math.min(Math.max(parseInt(styleWidth) + width, 5), 100) + "%";
                        }
                        else {
                            styleWidth =
                                Math.max(this.resizeTarget.clientWidth + width, 10) + "px";
                        }
                        this.resizeTarget.setAttribute("width", styleWidth);
                        // style.setProperty("width", styleWidth);
                    }
                }
                else {
                    if (float === "center") {
                        style.setProperty("display", "block");
                        style.setProperty("margin", "auto");
                        style.removeProperty("float");
                    }
                    else {
                        style.removeProperty("display");
                        style.removeProperty("margin");
                        style.setProperty("float", float);
                    }
                }
                this.positionResizerToTarget(this.resizeTarget);
            }
        };
        ResizePlugin.prototype.startResize = function (e) {
            var target = e.target;
            if (target.classList.contains("handler") && e.which === 1) {
                this.startResizePosition = {
                    left: e.clientX,
                    top: e.clientY,
                    width: this.resizeTarget.clientWidth,
                    height: this.resizeTarget.clientHeight,
                };
            }
        };
        ResizePlugin.prototype.endResize = function () {
            this.startResizePosition = null;
        };
        ResizePlugin.prototype.resizing = function (e) {
            if (!this.startResizePosition)
                return;
            var deltaX = e.clientX - this.startResizePosition.left;
            var deltaY = e.clientY - this.startResizePosition.top;
            var width = this.startResizePosition.width;
            var height = this.startResizePosition.height;
            width += deltaX;
            height += deltaY;
            if (e.altKey) {
                var originSize = this.resizeTarget.originSize;
                var rate = originSize.height / originSize.width;
                height = rate * width;
            }
            this.resizeTarget.setAttribute("width", Math.max(width, 30) + "");
            this.resizeTarget.setAttribute("height", Math.max(height, 30) + "");
            this.positionResizerToTarget(this.resizeTarget);
        };
        ResizePlugin.prototype.destory = function () {
            this.container.removeChild(this.resizer);
            window.removeEventListener("mouseup", this.endResize);
            window.removeEventListener("mousemove", this.resizing);
            this.resizer = null;
        };
        return ResizePlugin;
    }());

    var Iframe = /** @class */ (function () {
        function Iframe(element, cb) {
            this.element = element;
            this.cb = cb;
            this.hasTracked = false;
        }
        return Iframe;
    }());
    var IframeClick = /** @class */ (function () {
        function IframeClick() {
        }
        IframeClick.track = function (element, cb) {
            this.iframes.push(new Iframe(element, cb));
            if (!this.interval) {
                this.interval = setInterval(function () {
                    IframeClick.checkClick();
                }, this.resolution);
            }
        };
        IframeClick.checkClick = function () {
            if (document.activeElement) {
                var activeElement = document.activeElement;
                for (var i in this.iframes) {
                    if (activeElement === this.iframes[i].element) {
                        if (this.iframes[i].hasTracked == false) {
                            this.iframes[i].cb.apply(window, []);
                            this.iframes[i].hasTracked = true;
                        }
                    }
                    else {
                        this.iframes[i].hasTracked = false;
                    }
                }
            }
        };
        IframeClick.resolution = 200;
        IframeClick.iframes = [];
        IframeClick.interval = null;
        return IframeClick;
    }());

    function QuillResizeModule(quill, options) {
        var container = quill.root;
        var resizeTarge;
        var resizePlugin;
        container.addEventListener("click", function (e) {
            var target = e.target;
            if (e.target && ["img", "video"].includes(target.tagName.toLowerCase())) {
                resizeTarge = target;
                resizePlugin = new ResizePlugin(target, container.parentElement, options);
            }
        });
        quill.on("text-change", function (delta, source) {
            // iframe 大小调整
            container.querySelectorAll("iframe").forEach(function (item) {
                IframeClick.track(item, function () {
                    resizeTarge = item;
                    resizePlugin = new ResizePlugin(item, container.parentElement, options);
                });
            });
        });
        document.addEventListener("mousedown", function (e) {
            var _a, _b, _c;
            var target = e.target;
            if (target !== resizeTarge &&
                !((_b = (_a = resizePlugin === null || resizePlugin === void 0 ? void 0 : resizePlugin.resizer) === null || _a === void 0 ? void 0 : _a.contains) === null || _b === void 0 ? void 0 : _b.call(_a, target))) {
                (_c = resizePlugin === null || resizePlugin === void 0 ? void 0 : resizePlugin.destory) === null || _c === void 0 ? void 0 : _c.call(resizePlugin);
                resizePlugin = null;
                resizeTarge = null;
            }
        }, { capture: true });
    }

    return QuillResizeModule;

})));
