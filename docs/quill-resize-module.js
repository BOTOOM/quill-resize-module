(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.QuillResizeModule = factory());
})(this, (function () { 'use strict';

    /******************************************************************************
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
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
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

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z = "#editor-resizer {\n  position: absolute;\n  border: 1px dashed #fff;\n  background-color: rgba(0, 0, 0, 0.5);\n}\n#editor-resizer .handler {\n  position: absolute;\n  right: -5px;\n  bottom: -5px;\n  width: 10px;\n  height: 10px;\n  border: 1px solid #333;\n  background-color: rgba(255, 255, 255, 0.8);\n  cursor: nwse-resize;\n  user-select: none;\n}\n#editor-resizer .toolbar {\n  position: absolute;\n  top: -3em;\n  left: 50%;\n  min-width: 200px;\n  /* Minimum width for small objects */\n  max-width: 400px;\n  /* Maximum width for very small objects */\n  padding: 0.5em;\n  border: 1px solid #fff;\n  border-radius: 3px;\n  background-color: #fff;\n  box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);\n  transform: translateX(-50%);\n  z-index: 1000;\n  white-space: normal;\n  /* Allow text wrapping */\n  /* Responsive positioning for very small objects */\n}\n#editor-resizer .toolbar.small-object {\n  min-width: 250px;\n  top: -4em;\n}\n#editor-resizer .toolbar.very-small-object {\n  min-width: 300px;\n  top: -5em;\n  left: 0;\n  transform: none;\n}\n#editor-resizer .toolbar .group {\n  display: flex;\n  border: 1px solid #aaa;\n  border-radius: 6px;\n  overflow: hidden;\n  white-space: nowrap;\n  text-align: center;\n  flex-wrap: wrap;\n  /* Allow wrapping for very small objects */\n  /* Input wrapper improvements */\n}\n#editor-resizer .toolbar .group:not(:first-child) {\n  margin-top: 0.5em;\n}\n#editor-resizer .toolbar .group .btn {\n  flex: 1 0 auto;\n  /* Allow buttons to shrink */\n  min-width: 40px;\n  /* Minimum button width */\n  text-align: center;\n  padding: 0 0.3rem;\n  /* Reduced padding */\n  display: inline-block;\n  color: rgba(0, 0, 0, 0.65);\n  vertical-align: top;\n  line-height: 1.8;\n  /* Slightly reduced line height */\n  user-select: none;\n  font-size: 0.85em;\n  /* Smaller font for tight spaces */\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  /* Tooltip for truncated text */\n}\n#editor-resizer .toolbar .group .btn.btn-group {\n  padding: 0;\n  display: inline-flex;\n  line-height: 1.8em;\n  min-width: 60px;\n}\n#editor-resizer .toolbar .group .btn.btn-group .inner-btn {\n  flex: 1 0 0;\n  font-size: 1.5em;\n  /* Smaller icons */\n  width: 50%;\n  cursor: pointer;\n}\n#editor-resizer .toolbar .group .btn.btn-group .inner-btn:first-child {\n  border-right: 1px solid #ddd;\n}\n#editor-resizer .toolbar .group .btn.btn-group .inner-btn:active {\n  transform: scale(0.8);\n}\n#editor-resizer .toolbar .group .btn:not(:last-child) {\n  border-right: 1px solid #bbb;\n}\n#editor-resizer .toolbar .group .btn:not(.btn-group):active {\n  background-color: rgba(0, 0, 0, 0.1);\n}\n#editor-resizer .toolbar .group .btn:hover {\n  position: relative;\n}\n#editor-resizer .toolbar .group .btn:hover::after {\n  content: attr(data-full-text);\n  position: absolute;\n  bottom: 100%;\n  left: 50%;\n  transform: translateX(-50%);\n  background-color: #333;\n  color: white;\n  padding: 4px 8px;\n  border-radius: 4px;\n  font-size: 12px;\n  white-space: nowrap;\n  z-index: 1001;\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity 0.3s;\n}\n#editor-resizer .toolbar .group .btn:hover:hover::after {\n  opacity: 1;\n}\n#editor-resizer .toolbar .group .input-wrapper {\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n  min-width: 60px;\n  flex: 1 0 auto;\n}\n#editor-resizer .toolbar .group .input-wrapper input {\n  width: 40px;\n  text-align: center;\n  border: 1px solid #ddd;\n  border-radius: 2px;\n  padding: 2px 4px;\n  font-size: 0.85em;\n}\n#editor-resizer .toolbar .group .input-wrapper .suffix {\n  font-size: 0.75em;\n  margin-left: 2px;\n}\n#editor-resizer .toolbar .group .input-wrapper .tooltip {\n  position: absolute;\n  bottom: 100%;\n  left: 50%;\n  transform: translateX(-50%);\n  background-color: #333;\n  color: white;\n  padding: 4px 8px;\n  border-radius: 4px;\n  font-size: 11px;\n  white-space: nowrap;\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity 0.3s;\n  z-index: 1001;\n}\n#editor-resizer .toolbar .group .input-wrapper:hover .tooltip {\n  opacity: 1;\n}\n#editor-resizer .last-item {\n  margin-right: 5px;\n}\n#editor-resizer .showSize {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  padding: 0.1em;\n  border: 1px solid rgba(255, 255, 255, 0.8);\n  border-radius: 2px;\n  background-color: rgba(255, 255, 255, 0.8);\n  box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);\n  transform: translateX(-50%);\n  font-size: 0.8em;\n  /* Smaller font for tight spaces */\n}\n";
    styleInject(css_248z);

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
        inputTip: "Enter width percentage",
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
    /**
     * Get the closest scrollable parent of a given node.
     * @param node
     * @returns
     */
    function getScrollParent(node) {
        if (node == null) {
            return null;
        }
        var regex = /(auto|scroll)/;
        var parents = [];
        var parent = node;
        while (parent) {
            parents.push(parent);
            parent = parent.parentElement;
        }
        for (var i = 0; i < parents.length; i++) {
            var style = getComputedStyle(parents[i]);
            if (regex.test(style.overflow + style.overflowY + style.overflowX)) {
                return parents[i];
            }
            if (parents[i].tagName === "BODY") {
                return parents[i];
            }
        }
        return null;
    }

    /** @class */ ((function (_super) {
        __extends(ResizeElement, _super);
        function ResizeElement() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.originSize = null;
            return _this;
        }
        return ResizeElement;
    })(HTMLElement));
    var template = "\n<div class=\"handler\" title=\"{0}\"></div>\n<div class=\"toolbar\">\n  <div class=\"group\">\n    <a class=\"btn\" data-type=\"width\" data-styles=\"width:100%\">100%</a>\n    <a class=\"btn\" data-type=\"width\" data-styles=\"width:50%\">50%</a>\n    <span class=\"input-wrapper\"><input data-type=\"width\" maxlength=\"3\" /><span class=\"suffix\">%</span><span class=\"tooltip\">{5}</span></span>\n    <a class=\"btn\" data-type=\"width\" data-styles=\"width:auto; height:auto;\">{4}</a>\n  </div>\n  <div class=\"group\">\n    <a class=\"btn\" data-type=\"align\" data-styles=\"float:left\">{1}</a>\n    <a class=\"btn\" data-type=\"align\" data-styles=\"display:block;margin:auto;\">{2}</a>\n    <a class=\"btn\" data-type=\"align\" data-styles=\"float:right;\">{3}</a>\n    <a class=\"btn\" data-type=\"align\" data-styles=\"\">{4}</a>\n  </div>\n</div>\n";
    var ResizePlugin = /** @class */ (function () {
        function ResizePlugin(resizeTarget, container, options) {
            this.resizer = null;
            this.startResizePosition = null;
            this.i18n = new I18n((options === null || options === void 0 ? void 0 : options.locale) || defaultLocale);
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
        ResizePlugin.prototype.initResizer = function () {
            var resizer = this.container.querySelector("#editor-resizer");
            if (!resizer) {
                resizer = document.createElement("div");
                resizer.setAttribute("id", "editor-resizer");
                resizer.innerHTML = format(template, this.i18n.findLabel("altTip"), this.i18n.findLabel("floatLeft"), this.i18n.findLabel("center"), this.i18n.findLabel("floatRight"), this.i18n.findLabel("restore"), this.i18n.findLabel("inputTip"));
                this.container.appendChild(resizer);
            }
            this.resizer = resizer;
        };
        ResizePlugin.prototype.positionResizerToTarget = function (el) {
            if (this.resizer !== null) {
                // Check if element is contentEditable before proceeding
                if (!el.isContentEditable) {
                    return;
                }
                // Use getBoundingClientRect for more accurate positioning
                var containerRect = this.container.getBoundingClientRect();
                var elRect = el.getBoundingClientRect();
                this.resizer.style.setProperty("left", elRect.left - containerRect.left + "px");
                this.resizer.style.setProperty("top", elRect.top - containerRect.top + "px");
                this.resizer.style.setProperty("width", el.clientWidth + "px");
                this.resizer.style.setProperty("height", el.clientHeight + "px");
                // Add responsive classes based on element size
                var toolbar_1 = this.resizer.querySelector('.toolbar');
                if (toolbar_1) {
                    // Remove existing responsive classes
                    toolbar_1.classList.remove('small-object', 'very-small-object');
                    // Add appropriate class based on width
                    if (el.clientWidth < 150) {
                        toolbar_1.classList.add('very-small-object');
                    }
                    else if (el.clientWidth < 250) {
                        toolbar_1.classList.add('small-object');
                    }
                    // Add data-full-text attributes for tooltips
                    var buttons = toolbar_1.querySelectorAll('.btn');
                    buttons.forEach(function (btn) {
                        var button = btn;
                        if (button.scrollWidth > button.clientWidth) {
                            button.dataset.fullText = button.textContent || '';
                        }
                    });
                }
            }
        };
        ResizePlugin.prototype.bindEvents = function () {
            var _this = this;
            var _a;
            if (this.resizer !== null) {
                this.resizer.addEventListener("mousedown", this.startResize);
                this.resizer.addEventListener("click", this.toolbarClick);
                this.resizer.addEventListener("change", this.toolbarInputChange);
            }
            window.addEventListener("mouseup", this.endResize);
            window.addEventListener("mousemove", this.resizing);
            // Add scroll parent detection for better positioning
            (_a = getScrollParent(this.resizeTarget)) === null || _a === void 0 ? void 0 : _a.addEventListener("scroll", function () {
                _this.positionResizerToTarget(_this.resizeTarget);
            });
        };
        ResizePlugin.prototype._setStylesForToolbar = function (type, styles) {
            var _a;
            var storeKey = "_styles_".concat(type);
            var style = this.resizeTarget.style;
            var originStyles = this.resizeTarget[storeKey];
            style.cssText =
                style.cssText.replaceAll(" ", "").replace(originStyles, "") +
                    ";".concat(styles);
            this.resizeTarget[storeKey] = styles;
            this.positionResizerToTarget(this.resizeTarget);
            (_a = this.options) === null || _a === void 0 ? void 0 : _a.onChange(this.resizeTarget);
        };
        ResizePlugin.prototype.toolbarInputChange = function (e) {
            var _a;
            var target = e.target;
            var type = (_a = target === null || target === void 0 ? void 0 : target.dataset) === null || _a === void 0 ? void 0 : _a.type;
            var value = target.value;
            if (type && Number(value)) {
                this._setStylesForToolbar(type, "width: ".concat(Number(value), "%;"));
            }
        };
        ResizePlugin.prototype.toolbarClick = function (e) {
            var _a, _b;
            var target = e.target;
            var type = (_a = target === null || target === void 0 ? void 0 : target.dataset) === null || _a === void 0 ? void 0 : _a.type;
            if (type && target.classList.contains("btn")) {
                this._setStylesForToolbar(type, (_b = target === null || target === void 0 ? void 0 : target.dataset) === null || _b === void 0 ? void 0 : _b.styles);
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
            var _a;
            this.startResizePosition = null;
            (_a = this.options) === null || _a === void 0 ? void 0 : _a.onChange(this.resizeTarget);
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
            this.resizeTarget.style.setProperty("width", Math.max(width, 30) + "px");
            this.resizeTarget.style.setProperty("height", Math.max(height, 30) + "px");
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
            var existing = this.iframes.find(function (item) { return item.element === element; });
            if (existing) {
                existing.cb = cb;
                return;
            }
            this.iframes.push(new Iframe(element, cb));
            if (!this.interval) {
                this.interval = setInterval(function () {
                    IframeClick.checkClick();
                }, this.resolution);
            }
        };
        IframeClick.checkClick = function () {
            var activeElement = document.activeElement;
            if (activeElement) {
                for (var _i = 0, _a = this.iframes; _i < _a.length; _i++) {
                    var item = _a[_i];
                    if (activeElement === item.element) {
                        if (item.hasTracked === false) {
                            item.cb();
                            item.hasTracked = true;
                        }
                    }
                    else {
                        item.hasTracked = false;
                    }
                }
            }
        };
        IframeClick.resolution = 200;
        IframeClick.iframes = [];
        IframeClick.interval = null;
        return IframeClick;
    }());

    function isYouTubeUrl(url) {
        return /(?:youtube\.com|youtu\.be)/i.test(url);
    }
    function extractYouTubeVideoId(url) {
        var patterns = [
            /(?:youtube\.com\/watch\?v=)([\w-]{11})/i,
            /(?:youtube\.com\/embed\/)([\w-]{11})/i,
            /(?:youtu\.be\/)([\w-]{11})/i,
        ];
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            var match = pattern.exec(url);
            if (match === null || match === void 0 ? void 0 : match[1]) {
                return match[1];
            }
        }
        return null;
    }
    function normalizeYouTubeIframe(iframe) {
        var src = iframe.getAttribute("src") || "";
        if (!isYouTubeUrl(src)) {
            return;
        }
        var videoId = extractYouTubeVideoId(src);
        if (!videoId) {
            return;
        }
        var origin = encodeURIComponent(globalThis.location.origin);
        var normalizedSrc = "https://www.youtube.com/embed/".concat(videoId) +
            "?enablejsapi=1&playsinline=1&origin=".concat(origin, "&rel=0");
        if (iframe.src !== normalizedSrc) {
            iframe.src = normalizedSrc;
        }
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    }
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
                normalizeYouTubeIframe(item);
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

}));
//# sourceMappingURL=quill-resize-module.js.map
