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

    var css_248z = "#editor-resizer {\n  position: absolute;\n  border: 1px dashed #fff;\n  background-color: rgba(0, 0, 0, 0.5);\n  /* .handler and .btn are real <button> elements (for native keyboard\n     activation/focusability), which come with browser default chrome\n     (padding, border, background, font). Reset that here; the more\n     specific .handler/.btn rules below win the cascade and re-apply the\n     actual look, so this is purely an appearance reset, not a behavior\n     change. `all: unset` also clears the default focus outline, so it is\n     restored explicitly via :focus-visible. */\n}\n#editor-resizer button {\n  all: unset;\n  box-sizing: border-box;\n  cursor: pointer;\n}\n#editor-resizer button:focus-visible {\n  outline: 2px solid #4f9eff;\n  outline-offset: 2px;\n}\n#editor-resizer .handler {\n  position: absolute;\n  right: -5px;\n  bottom: -5px;\n  width: 10px;\n  height: 10px;\n  border: 1px solid #333;\n  background-color: rgba(255, 255, 255, 0.8);\n  cursor: nwse-resize;\n  user-select: none;\n  /* Prevent the browser's native touch scrolling/panning gestures from\n       competing with a pointer-based resize drag on touch screens. */\n  touch-action: none;\n  /* The visible handle is intentionally small so it doesn't obscure the\n       media being resized, but a 10x10px target is far below the ~44px\n       minimum recommended for touch input. This invisible pseudo-element\n       enlarges the actual hit/pointer area without changing how the\n       handle looks; pointer/touch events anywhere within it still report\n       `.handler` as their target since pseudo-elements aren't\n       independently targetable. */\n}\n#editor-resizer .handler::before {\n  content: \"\";\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  width: 40px;\n  height: 40px;\n  transform: translate(-50%, -50%);\n}\n#editor-resizer .size-label {\n  position: absolute;\n  left: 50%;\n  bottom: -1.6em;\n  transform: translateX(-50%);\n  padding: 0.1em 0.5em;\n  border-radius: 3px;\n  background-color: rgba(0, 0, 0, 0.65);\n  color: #fff;\n  font-size: 0.75em;\n  white-space: nowrap;\n  user-select: none;\n  pointer-events: none;\n}\n#editor-resizer .toolbar {\n  position: absolute;\n  top: -3em;\n  left: 50%;\n  min-width: 200px;\n  /* Minimum width for small objects */\n  max-width: 400px;\n  /* Maximum width for very small objects */\n  padding: 0.5em;\n  border: 1px solid #fff;\n  border-radius: 3px;\n  background-color: #fff;\n  box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);\n  transform: translateX(-50%);\n  z-index: 1000;\n  white-space: normal;\n  /* Allow text wrapping */\n  /* Responsive positioning for very small objects */\n}\n#editor-resizer .toolbar.small-object {\n  min-width: 250px;\n  top: -4em;\n}\n#editor-resizer .toolbar.very-small-object {\n  min-width: 300px;\n  top: -5em;\n  left: 0;\n  transform: none;\n}\n#editor-resizer .toolbar .group {\n  display: flex;\n  border: 1px solid #aaa;\n  border-radius: 6px;\n  overflow: hidden;\n  white-space: nowrap;\n  text-align: center;\n  flex-wrap: wrap;\n  /* Allow wrapping for very small objects */\n  /* Input wrapper improvements */\n}\n#editor-resizer .toolbar .group:not(:first-child) {\n  margin-top: 0.5em;\n}\n#editor-resizer .toolbar .group .btn {\n  flex: 1 0 auto;\n  /* Allow buttons to shrink */\n  min-width: 40px;\n  /* Minimum button width */\n  text-align: center;\n  padding: 0 0.3rem;\n  /* Reduced padding */\n  display: inline-block;\n  color: rgba(0, 0, 0, 0.65);\n  vertical-align: top;\n  line-height: 1.8;\n  /* Slightly reduced line height */\n  user-select: none;\n  font-size: 0.85em;\n  /* Smaller font for tight spaces */\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  /* Tooltip for truncated text */\n}\n#editor-resizer .toolbar .group .btn.btn-group {\n  padding: 0;\n  display: inline-flex;\n  line-height: 1.8em;\n  min-width: 60px;\n}\n#editor-resizer .toolbar .group .btn.btn-group .inner-btn {\n  flex: 1 0 0;\n  font-size: 1.5em;\n  /* Smaller icons */\n  width: 50%;\n  cursor: pointer;\n}\n#editor-resizer .toolbar .group .btn.btn-group .inner-btn:first-child {\n  border-right: 1px solid #ddd;\n}\n#editor-resizer .toolbar .group .btn.btn-group .inner-btn:active {\n  transform: scale(0.8);\n}\n#editor-resizer .toolbar .group .btn:not(:last-child) {\n  border-right: 1px solid #bbb;\n}\n#editor-resizer .toolbar .group .btn:not(.btn-group):active {\n  background-color: rgba(0, 0, 0, 0.1);\n}\n#editor-resizer .toolbar .group .btn:hover {\n  position: relative;\n}\n#editor-resizer .toolbar .group .btn:hover::after {\n  content: attr(data-full-text);\n  position: absolute;\n  bottom: 100%;\n  left: 50%;\n  transform: translateX(-50%);\n  background-color: #333;\n  color: white;\n  padding: 4px 8px;\n  border-radius: 4px;\n  font-size: 12px;\n  white-space: nowrap;\n  z-index: 1001;\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity 0.3s;\n}\n#editor-resizer .toolbar .group .btn:hover:hover::after {\n  opacity: 1;\n}\n#editor-resizer .toolbar .group .input-wrapper {\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n  min-width: 60px;\n  flex: 1 0 auto;\n}\n#editor-resizer .toolbar .group .input-wrapper input {\n  width: 40px;\n  text-align: center;\n  border: 1px solid #ddd;\n  border-radius: 2px;\n  padding: 2px 4px;\n  font-size: 0.85em;\n}\n#editor-resizer .toolbar .group .input-wrapper .suffix {\n  font-size: 0.75em;\n  margin-left: 2px;\n}\n#editor-resizer .toolbar .group .input-wrapper .tooltip {\n  position: absolute;\n  bottom: 100%;\n  left: 50%;\n  transform: translateX(-50%);\n  background-color: #333;\n  color: white;\n  padding: 4px 8px;\n  border-radius: 4px;\n  font-size: 11px;\n  white-space: nowrap;\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity 0.3s;\n  z-index: 1001;\n}\n#editor-resizer .toolbar .group .input-wrapper:hover .tooltip {\n  opacity: 1;\n}\n#editor-resizer .last-item {\n  margin-right: 5px;\n}\n#editor-resizer .showSize {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  padding: 0.1em;\n  border: 1px solid rgba(255, 255, 255, 0.8);\n  border-radius: 2px;\n  background-color: rgba(255, 255, 255, 0.8);\n  box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);\n  transform: translateX(-50%);\n  font-size: 0.8em;\n  /* Smaller font for tight spaces */\n}\n#editor-resizer .attributes-panel {\n  position: absolute;\n  top: -3em;\n  left: 50%;\n  transform: translateX(-50%);\n  min-width: 220px;\n  padding: 0.6em;\n  border: 1px solid #fff;\n  border-radius: 3px;\n  background-color: #fff;\n  box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);\n  z-index: 1000;\n}\n#editor-resizer .attributes-panel .field {\n  display: block;\n  margin-bottom: 0.4em;\n  font-size: 0.8em;\n  color: rgba(0, 0, 0, 0.65);\n}\n#editor-resizer .attributes-panel .field input {\n  display: block;\n  width: 100%;\n  margin-top: 0.2em;\n  box-sizing: border-box;\n  border: 1px solid #ddd;\n  border-radius: 2px;\n  padding: 0.3em;\n  font-size: 1em;\n}\n#editor-resizer .attributes-panel .actions {\n  display: flex;\n  justify-content: flex-end;\n  gap: 0.4em;\n}\n#editor-resizer .attributes-panel .actions .btn {\n  padding: 0.2em 0.6em;\n  border: 1px solid #aaa;\n  border-radius: 3px;\n  font-size: 0.8em;\n  color: rgba(0, 0, 0, 0.65);\n}\n";
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
        toolbarLabel: "Media resize toolbar",
        handlerLabel: "Resize handle. Use arrow keys to resize, hold Alt to keep the aspect ratio, press 0 to restore the original size, Escape to close.",
        editAttributesLabel: "Edit alt text and title",
        attributesPanelLabel: "Edit media attributes",
        altTextLabel: "Alt text",
        titleTextLabel: "Title",
        saveLabel: "Save",
        cancelLabel: "Cancel",
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
    var WIDTH_FORMAT = "width";
    var HEIGHT_FORMAT = "height";
    var ALIGN_FORMAT = "resizeAlign";
    var ALT_FORMAT = "alt";
    var TITLE_FORMAT = "title";
    var VIDEO_FILE_BLOT_NAME = "videoFile";
    var ALIGN_VALUES = ["left", "center", "right"];
    function readAlignValue(node) {
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
    function applyAlignValue(node, value) {
        node.style.removeProperty("float");
        node.style.removeProperty("display");
        node.style.removeProperty("margin");
        if (value === "left" || value === "right") {
            node.style.setProperty("float", value);
        }
        else if (value === "center") {
            node.style.setProperty("display", "block");
            node.style.setProperty("margin", "auto");
        }
    }
    function createStyleAttributor(Parchment, attrName, keyName) {
        var ResizeStyleAttributor = /** @class */ (function (_super) {
            __extends(ResizeStyleAttributor, _super);
            function ResizeStyleAttributor(name, key, options) {
                return _super.call(this, name, key, options) || this;
            }
            return ResizeStyleAttributor;
        }(Parchment.StyleAttributor));
        return new ResizeStyleAttributor(attrName, keyName, {
            scope: Parchment.Scope.INLINE,
        });
    }
    function createAlignAttributor(Parchment) {
        var ResizeAlignAttributor = /** @class */ (function (_super) {
            __extends(ResizeAlignAttributor, _super);
            function ResizeAlignAttributor(name, key, options) {
                return _super.call(this, name, key, options) || this;
            }
            ResizeAlignAttributor.prototype.add = function (node, value) {
                if (!this.canAdd(node, value)) {
                    return false;
                }
                applyAlignValue(node, value);
                return true;
            };
            ResizeAlignAttributor.prototype.remove = function (node) {
                applyAlignValue(node, undefined);
            };
            ResizeAlignAttributor.prototype.value = function (node) {
                return readAlignValue(node);
            };
            return ResizeAlignAttributor;
        }(Parchment.Attributor));
        return new ResizeAlignAttributor(ALIGN_FORMAT, "align", {
            scope: Parchment.Scope.INLINE,
            whitelist: ALIGN_VALUES,
        });
    }
    /**
     * Generic attributor for a plain HTML attribute (`alt`, `title`), used to
     * persist media-attribute edits through the Delta model. Unlike
     * `createStyleAttributor`, this reads/writes a real DOM attribute rather
     * than an inline style property.
     */
    function createAttributeAttributor(Parchment, attrName, htmlAttr) {
        var ResizeAttributeAttributor = /** @class */ (function (_super) {
            __extends(ResizeAttributeAttributor, _super);
            function ResizeAttributeAttributor(name, key, options) {
                return _super.call(this, name, key, options) || this;
            }
            ResizeAttributeAttributor.prototype.add = function (node, value) {
                if (!this.canAdd(node, value)) {
                    return false;
                }
                node.setAttribute(htmlAttr, String(value));
                return true;
            };
            ResizeAttributeAttributor.prototype.remove = function (node) {
                node.removeAttribute(htmlAttr);
            };
            ResizeAttributeAttributor.prototype.value = function (node) {
                var _a;
                return (_a = node.getAttribute(htmlAttr)) !== null && _a !== void 0 ? _a : undefined;
            };
            return ResizeAttributeAttributor;
        }(Parchment.Attributor));
        return new ResizeAttributeAttributor(attrName, htmlAttr, {
            scope: Parchment.Scope.ATTRIBUTE,
        });
    }
    function withResizeFormats(BaseBlot, attributors) {
        return /** @class */ (function (_super) {
            __extends(ResizableBlot, _super);
            function ResizableBlot() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ResizableBlot.formats = function (domNode) {
                var formats = typeof BaseBlot.formats === "function"
                    ? __assign({}, BaseBlot.formats(domNode)) : {};
                attributors.forEach(function (attributor) {
                    var value = attributor.value(domNode);
                    if (value) {
                        formats[attributor.attrName] = value;
                    }
                });
                return formats;
            };
            ResizableBlot.prototype.format = function (name, value) {
                var attributor = attributors.find(function (item) { return item.attrName === name; });
                if (attributor) {
                    if (value) {
                        attributor.add(this.domNode, value);
                    }
                    else {
                        attributor.remove(this.domNode);
                    }
                    return;
                }
                _super.prototype.format.call(this, name, value);
            };
            return ResizableBlot;
        }(BaseBlot));
    }
    /**
     * Blot for literal HTML5 `<video>` elements (self-hosted media), which
     * Quill has no built-in format for — its default `formats/video` blot
     * renders an `<iframe>` embed instead. Registered as a plain inline embed,
     * mirroring how `formats/image` behaves.
     */
    function createVideoFileBlot(Parchment) {
        var VideoFile = /** @class */ (function (_super) {
            __extends(VideoFile, _super);
            function VideoFile() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            VideoFile.create = function (value) {
                var node = _super.create.call(this, value);
                node.setAttribute("controls", "true");
                if (typeof value === "string") {
                    node.setAttribute("src", value);
                }
                return node;
            };
            VideoFile.value = function (domNode) {
                return domNode.getAttribute("src");
            };
            VideoFile.blotName = VIDEO_FILE_BLOT_NAME;
            VideoFile.tagName = "VIDEO";
            return VideoFile;
        }(Parchment.EmbedBlot));
        return VideoFile;
    }
    var registered = false;
    /**
     * Registers resize-aware `image`, `video` (iframe embed) and `videoFile`
     * (literal `<video>` tag) blots on the given Quill class. Idempotent: safe
     * to call once per editor instance, registration only ever happens once.
     */
    function registerResizeFormats(QuillCtor) {
        if (registered || !(QuillCtor === null || QuillCtor === void 0 ? void 0 : QuillCtor.import)) {
            return;
        }
        var Parchment = QuillCtor.import("parchment");
        var attributors = [
            createStyleAttributor(Parchment, WIDTH_FORMAT, "width"),
            createStyleAttributor(Parchment, HEIGHT_FORMAT, "height"),
            createAlignAttributor(Parchment),
            createAttributeAttributor(Parchment, ALT_FORMAT, "alt"),
            createAttributeAttributor(Parchment, TITLE_FORMAT, "title"),
        ];
        var BaseImage = QuillCtor.import("formats/image");
        var BaseVideo = QuillCtor.import("formats/video");
        if (BaseImage) {
            QuillCtor.register(withResizeFormats(BaseImage, attributors), true);
        }
        if (BaseVideo) {
            QuillCtor.register(withResizeFormats(BaseVideo, attributors), true);
        }
        var VideoFileBlot = createVideoFileBlot(Parchment);
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
    function syncResizeStateToQuill(quill, target) {
        var _a;
        var _b;
        if (!((_b = quill === null || quill === void 0 ? void 0 : quill.constructor) === null || _b === void 0 ? void 0 : _b.find) || typeof quill.getIndex !== "function") {
            return;
        }
        var blot = quill.constructor.find(target);
        if (!blot || typeof quill.formatText !== "function") {
            return;
        }
        var index = quill.getIndex(blot);
        quill.formatText(index, 1, (_a = {},
            _a[WIDTH_FORMAT] = target.style.width || "",
            _a[HEIGHT_FORMAT] = target.style.height || "",
            _a[ALIGN_FORMAT] = readAlignValue(target) || "",
            _a[ALT_FORMAT] = target.getAttribute("alt") || "",
            _a[TITLE_FORMAT] = target.getAttribute("title") || "",
            _a), "user");
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
    var template = "\n<button type=\"button\" class=\"handler\" title=\"{0}\" aria-label=\"{6}\"></button>\n<span class=\"size-label\" aria-hidden=\"true\"></span>\n<div class=\"toolbar\" role=\"toolbar\" aria-label=\"{7}\">\n  <div class=\"group\" data-group=\"size\">\n    <span class=\"input-wrapper\"><input type=\"text\" data-type=\"width\" maxlength=\"3\" aria-label=\"{5}\" /><span class=\"suffix\">%</span><span class=\"tooltip\">{5}</span></span>\n    <button type=\"button\" class=\"btn\" data-type=\"width\" data-styles=\"width:auto; height:auto;\">{4}</button>\n  </div>\n  <div class=\"group\" data-group=\"align\">\n    <button type=\"button\" class=\"btn\" data-type=\"align\" data-styles=\"float:left\">{1}</button>\n    <button type=\"button\" class=\"btn\" data-type=\"align\" data-styles=\"display:block;margin:auto;\">{2}</button>\n    <button type=\"button\" class=\"btn\" data-type=\"align\" data-styles=\"float:right;\">{3}</button>\n    <button type=\"button\" class=\"btn\" data-type=\"align\" data-styles=\"\">{4}</button>\n  </div>\n  <div class=\"group\" data-group=\"attributes\">\n    <button type=\"button\" class=\"btn\" data-type=\"attributes\" aria-haspopup=\"true\" aria-expanded=\"false\" title=\"{8}\">{8}</button>\n  </div>\n</div>\n<div class=\"attributes-panel\" role=\"dialog\" aria-label=\"{9}\" hidden>\n  <label class=\"field\" data-field=\"alt\">{10}<input type=\"text\" data-attr=\"alt\" /></label>\n  <label class=\"field\" data-field=\"title\">{11}<input type=\"text\" data-attr=\"title\" /></label>\n  <div class=\"actions\">\n    <button type=\"button\" class=\"btn\" data-action=\"save-attributes\">{12}</button>\n    <button type=\"button\" class=\"btn\" data-action=\"cancel-attributes\">{13}</button>\n  </div>\n</div>\n";
    var ResizePlugin = /** @class */ (function () {
        function ResizePlugin(resizeTarget, container, options) {
            var _this = this;
            var _a, _b, _c, _d, _e, _f;
            this.resizer = null;
            this.startResizePosition = null;
            this.scrollParent = null;
            this.activePointerId = null;
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
            this.onKeyDown = this.onKeyDown.bind(this);
            this.onScroll = function () { return _this.positionResizerToTarget(_this.resizeTarget); };
            this.bindEvents();
            // Move focus onto the resize handle whenever the overlay activates
            // (or re-targets), so a keyboard user who reached it — via a click, or
            // via Tab if it was already open — can immediately resize with the
            // arrow keys instead of being stuck needing a mouse.
            if (((_a = this.options) === null || _a === void 0 ? void 0 : _a.__autoFocus) !== false) {
                (_d = (_c = (_b = this.resizer) === null || _b === void 0 ? void 0 : _b.querySelector(".handler")) === null || _c === void 0 ? void 0 : _c.focus) === null || _d === void 0 ? void 0 : _d.call(_c, { preventScroll: true });
            }
            (_f = (_e = this.options) === null || _e === void 0 ? void 0 : _e.onSelect) === null || _f === void 0 ? void 0 : _f.call(_e, resizeTarget);
        }
        /**
         * Builds the typed payload passed to onResize/onAlignChange, reading the
         * target's current width/height/align directly from the DOM so it always
         * reflects the latest state (including changes made outside this class).
         */
        ResizePlugin.prototype._buildChangeEvent = function () {
            var _a;
            return {
                target: this.resizeTarget,
                width: this.resizeTarget.clientWidth,
                height: this.resizeTarget.clientHeight,
                align: (_a = readAlignValue(this.resizeTarget)) !== null && _a !== void 0 ? _a : null,
            };
        };
        /**
         * Clamps a single dimension to the configured min/max (via
         * `options.constraints`), always enforcing an absolute 30px floor as a
         * safety net (matching the library's previous unconfigurable minimum)
         * even if a smaller `minWidth`/`minHeight` is provided.
         */
        ResizePlugin.prototype._clampDimension = function (value, min, max) {
            var FLOOR = 30;
            var result = Math.max(value, Math.max(FLOOR, min !== null && min !== void 0 ? min : 0));
            if (typeof max === "number") {
                result = Math.min(result, max);
            }
            return result;
        };
        /** Clamps a width/height pair using `options.constraints`. */
        ResizePlugin.prototype._clampSize = function (width, height) {
            var _a;
            var constraints = ((_a = this.options) === null || _a === void 0 ? void 0 : _a.constraints) || {};
            return {
                width: this._clampDimension(width, constraints.minWidth, constraints.maxWidth),
                height: this._clampDimension(height, constraints.minHeight, constraints.maxHeight),
            };
        };
        ResizePlugin.prototype.initResizer = function () {
            var resizer = this.container.querySelector("#editor-resizer");
            if (!resizer) {
                resizer = document.createElement("div");
                resizer.setAttribute("id", "editor-resizer");
                resizer.innerHTML = format(template, this.i18n.findLabel("altTip"), this.i18n.findLabel("floatLeft"), this.i18n.findLabel("center"), this.i18n.findLabel("floatRight"), this.i18n.findLabel("restore"), this.i18n.findLabel("inputTip"), this.i18n.findLabel("handlerLabel"), this.i18n.findLabel("toolbarLabel"), this.i18n.findLabel("editAttributesLabel"), this.i18n.findLabel("attributesPanelLabel"), this.i18n.findLabel("altTextLabel"), this.i18n.findLabel("titleTextLabel"), this.i18n.findLabel("saveLabel"), this.i18n.findLabel("cancelLabel"));
                this.container.appendChild(resizer);
            }
            this.resizer = resizer;
            this.applyToolbarVisibility();
            this._configureSizeToolbar();
        };
        /**
         * Applies the showToolbar/toolbar.sizeTools/toolbar.alignTools options
         * to the overlay markup. Re-run on every initResizer() call (not just on
         * first creation) since the overlay element may be reused across
         * activations of the same ResizePlugin/QuillResizeModule instance.
         */
        ResizePlugin.prototype.applyToolbarVisibility = function () {
            var _a, _b, _c, _d, _e;
            if (!this.resizer) {
                return;
            }
            var showToolbar = ((_a = this.options) === null || _a === void 0 ? void 0 : _a.showToolbar) !== false;
            var toolbarOptions = ((_b = this.options) === null || _b === void 0 ? void 0 : _b.toolbar) || {};
            var showSizeTools = toolbarOptions.sizeTools !== false;
            // `alingTools` is the deprecated (misspelled) alias for `alignTools`;
            // prefer the corrected name when both are provided.
            var showAlignTools = (_d = (_c = toolbarOptions.alignTools) !== null && _c !== void 0 ? _c : toolbarOptions.alingTools) !== null && _d !== void 0 ? _d : true;
            var toolbar = this.resizer.querySelector(".toolbar");
            if (toolbar) {
                toolbar.style.display = showToolbar ? "" : "none";
            }
            var sizeGroup = this.resizer.querySelector('[data-group="size"]');
            if (sizeGroup) {
                sizeGroup.style.display = showSizeTools ? "" : "none";
            }
            var alignGroup = this.resizer.querySelector('[data-group="align"]');
            if (alignGroup) {
                alignGroup.style.display = showAlignTools ? "" : "none";
            }
            var showAttributesTool = toolbarOptions.attributesTool !== false;
            var attributesGroup = this.resizer.querySelector('[data-group="attributes"]');
            if (attributesGroup) {
                attributesGroup.style.display = showAttributesTool ? "" : "none";
            }
            var sizeLabel = this.resizer.querySelector(".size-label");
            if (sizeLabel) {
                sizeLabel.style.display = ((_e = this.options) === null || _e === void 0 ? void 0 : _e.showSize) ? "" : "none";
            }
        };
        /**
         * Renders `toolbar.sizePresets` as quick-size buttons and applies
         * `toolbar.sizeUnit` to the width input's suffix/max length. Re-run on
         * every initResizer() call (like applyToolbarVisibility()) since the
         * overlay element is reused across activations, which may carry
         * different options than whichever activation first created it.
         */
        ResizePlugin.prototype._configureSizeToolbar = function () {
            var _a, _b, _c;
            if (!this.resizer) {
                return;
            }
            var toolbarOptions = ((_a = this.options) === null || _a === void 0 ? void 0 : _a.toolbar) || {};
            var unit = (_b = toolbarOptions.sizeUnit) !== null && _b !== void 0 ? _b : "%";
            var presets = (_c = toolbarOptions.sizePresets) !== null && _c !== void 0 ? _c : [100, 50];
            var sizeGroup = this.resizer.querySelector('[data-group="size"]');
            if (sizeGroup) {
                // Remove preset buttons rendered by a previous activation before
                // re-rendering, since the overlay element is reused.
                sizeGroup
                    .querySelectorAll(".btn[data-percent]")
                    .forEach(function (btn) { return btn.remove(); });
                var inputWrapper_1 = sizeGroup.querySelector(".input-wrapper");
                presets.forEach(function (percent) {
                    var btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "btn";
                    btn.dataset.type = "width";
                    btn.dataset.percent = String(percent);
                    btn.textContent = "".concat(percent, "%");
                    sizeGroup.insertBefore(btn, inputWrapper_1);
                });
            }
            var suffix = this.resizer.querySelector(".input-wrapper .suffix");
            if (suffix) {
                suffix.textContent = unit;
            }
            var input = this.resizer.querySelector('input[data-type="width"]');
            if (input) {
                input.setAttribute("maxlength", unit === "px" ? "5" : "3");
            }
        };
        ResizePlugin.prototype.positionResizerToTarget = function (el) {
            var _a;
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
                if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.showSize) {
                    var sizeLabel = this.resizer.querySelector(".size-label");
                    if (sizeLabel) {
                        sizeLabel.textContent = "".concat(Math.round(el.clientWidth), " x ").concat(Math.round(el.clientHeight));
                    }
                }
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
            var _a;
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
            (_a = this.scrollParent) === null || _a === void 0 ? void 0 : _a.addEventListener("scroll", this.onScroll);
        };
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
        ResizePlugin.prototype.onKeyDown = function (e) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            var target = e.target;
            // Escape inside the attributes panel closes just the panel, not the
            // whole overlay (mirrors closing a modal/popover without discarding
            // the active resize target).
            if (e.key === "Escape" && target.closest(".attributes-panel")) {
                e.preventDefault();
                this._toggleAttributesPanel(false);
                return;
            }
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
            var arrowDeltas = {
                ArrowUp: [0, -1],
                ArrowDown: [0, 1],
                ArrowLeft: [-1, 0],
                ArrowRight: [1, 0],
            };
            var delta = arrowDeltas[e.key];
            if (!delta) {
                return;
            }
            e.preventDefault();
            var step = e.shiftKey ? 10 : 1;
            var width = this.resizeTarget.clientWidth + delta[0] * step;
            var height = this.resizeTarget.clientHeight + delta[1] * step;
            if (e.altKey || ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.constraints) === null || _b === void 0 ? void 0 : _b.lockAspectRatio)) {
                var originSize = this.resizeTarget.originSize;
                var rate = originSize.height / originSize.width;
                height = rate * width;
            }
            var clamped = this._clampSize(width, height);
            this.resizeTarget.style.setProperty("width", clamped.width + "px");
            this.resizeTarget.style.setProperty("height", clamped.height + "px");
            this.positionResizerToTarget(this.resizeTarget);
            this._syncPersistence();
            // Each keystroke is a complete, atomic resize gesture (there's no
            // natural discrete "gesture end" signal for individual keypresses like
            // there is for pointer drags), so start/resize/end all fire together.
            (_d = (_c = this.options) === null || _c === void 0 ? void 0 : _c.onResizeStart) === null || _d === void 0 ? void 0 : _d.call(_c, this.resizeTarget);
            (_f = (_e = this.options) === null || _e === void 0 ? void 0 : _e.onResize) === null || _f === void 0 ? void 0 : _f.call(_e, this.resizeTarget, this._buildChangeEvent());
            (_h = (_g = this.options) === null || _g === void 0 ? void 0 : _g.onResizeEnd) === null || _h === void 0 ? void 0 : _h.call(_g, this.resizeTarget);
            (_k = (_j = this.options) === null || _j === void 0 ? void 0 : _j.onChange) === null || _k === void 0 ? void 0 : _k.call(_j, this.resizeTarget);
        };
        ResizePlugin.prototype._setStylesForToolbar = function (type, styles) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            var storeKey = "_styles_".concat(type);
            var style = this.resizeTarget.style;
            var originStyles = this.resizeTarget[storeKey];
            style.cssText =
                style.cssText.replaceAll(" ", "").replace(originStyles, "") +
                    ";".concat(styles);
            this.resizeTarget[storeKey] = styles;
            this.positionResizerToTarget(this.resizeTarget);
            this._syncPersistence();
            if (type === "align") {
                (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.onAlignChange) === null || _b === void 0 ? void 0 : _b.call(_a, this.resizeTarget, (_c = readAlignValue(this.resizeTarget)) !== null && _c !== void 0 ? _c : null);
            }
            else {
                // Toolbar-driven width changes (presets or restore) are a discrete
                // resize with no separate "in progress" state, so start/resize/end
                // all fire together, mirroring the keyboard-shortcut resize below.
                (_e = (_d = this.options) === null || _d === void 0 ? void 0 : _d.onResizeStart) === null || _e === void 0 ? void 0 : _e.call(_d, this.resizeTarget);
                (_g = (_f = this.options) === null || _f === void 0 ? void 0 : _f.onResize) === null || _g === void 0 ? void 0 : _g.call(_f, this.resizeTarget, this._buildChangeEvent());
                (_j = (_h = this.options) === null || _h === void 0 ? void 0 : _h.onResizeEnd) === null || _j === void 0 ? void 0 : _j.call(_h, this.resizeTarget);
            }
            (_l = (_k = this.options) === null || _k === void 0 ? void 0 : _k.onChange) === null || _l === void 0 ? void 0 : _l.call(_k, this.resizeTarget);
        };
        /**
         * Persists the current width/height/align inline styles into the Quill
         * Delta (when a live Quill instance was provided via options), so they
         * survive getContents()/setContents() round trips instead of only living
         * as inline styles on the DOM node.
         */
        ResizePlugin.prototype._syncPersistence = function () {
            var _a;
            var quill = (_a = this.options) === null || _a === void 0 ? void 0 : _a.__quillInstance;
            if (quill) {
                syncResizeStateToQuill(quill, this.resizeTarget);
            }
        };
        /**
         * Computes the CSS to apply for a given width preset percentage,
         * honoring `toolbar.sizeUnit`:
         * - `"%"` (default): a relative `width: N%;`.
         * - `"px"`: an absolute width computed from the target's original size,
         *   clamped to `options.constraints`, with `height: auto;` so images and
         *   videos keep their intrinsic aspect ratio.
         */
        ResizePlugin.prototype._computeWidthStyles = function (percent) {
            var _a, _b, _c, _d;
            var unit = (_c = (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.toolbar) === null || _b === void 0 ? void 0 : _b.sizeUnit) !== null && _c !== void 0 ? _c : "%";
            if (unit === "px") {
                var originSize = this.resizeTarget.originSize;
                var baseWidth = (originSize === null || originSize === void 0 ? void 0 : originSize.width) || this.resizeTarget.clientWidth || 0;
                var rawWidth = Math.round((baseWidth * percent) / 100);
                var constraints = ((_d = this.options) === null || _d === void 0 ? void 0 : _d.constraints) || {};
                var width = this._clampDimension(rawWidth, constraints.minWidth, constraints.maxWidth);
                return "width:".concat(width, "px; height:auto;");
            }
            return "width:".concat(percent, "%;");
        };
        ResizePlugin.prototype.toolbarInputChange = function (e) {
            var _a, _b, _c, _d, _e;
            var target = e.target;
            var type = (_a = target === null || target === void 0 ? void 0 : target.dataset) === null || _a === void 0 ? void 0 : _a.type;
            var value = Number(target.value);
            if (type && value) {
                var unit = (_d = (_c = (_b = this.options) === null || _b === void 0 ? void 0 : _b.toolbar) === null || _c === void 0 ? void 0 : _c.sizeUnit) !== null && _d !== void 0 ? _d : "%";
                if (unit === "px") {
                    var constraints = ((_e = this.options) === null || _e === void 0 ? void 0 : _e.constraints) || {};
                    var width = this._clampDimension(value, constraints.minWidth, constraints.maxWidth);
                    this._setStylesForToolbar(type, "width:".concat(width, "px; height:auto;"));
                }
                else {
                    this._setStylesForToolbar(type, "width: ".concat(value, "%;"));
                }
            }
        };
        ResizePlugin.prototype.toolbarClick = function (e) {
            var _a, _b, _c, _d;
            var target = e.target;
            var type = (_a = target === null || target === void 0 ? void 0 : target.dataset) === null || _a === void 0 ? void 0 : _a.type;
            var action = (_b = target === null || target === void 0 ? void 0 : target.dataset) === null || _b === void 0 ? void 0 : _b.action;
            if (type === "attributes") {
                this._toggleAttributesPanel();
                return;
            }
            if (action === "save-attributes") {
                this._saveAttributes();
                return;
            }
            if (action === "cancel-attributes") {
                this._toggleAttributesPanel(false);
                return;
            }
            if (type && target.classList.contains("btn")) {
                var percentAttr = (_c = target.dataset) === null || _c === void 0 ? void 0 : _c.percent;
                if (type === "width" && percentAttr) {
                    this._setStylesForToolbar(type, this._computeWidthStyles(Number(percentAttr)));
                }
                else {
                    this._setStylesForToolbar(type, (_d = target === null || target === void 0 ? void 0 : target.dataset) === null || _d === void 0 ? void 0 : _d.styles);
                }
            }
        };
        /**
         * Shows or hides the alt/title attributes panel. When opening (no
         * explicit `show` argument, or `show === true`), populates the inputs
         * with the target's current `alt`/`title` attributes and hides the alt
         * field for non-`img` targets (alt text only applies to images).
         */
        ResizePlugin.prototype._toggleAttributesPanel = function (show) {
            var _a, _b;
            var panel = (_a = this.resizer) === null || _a === void 0 ? void 0 : _a.querySelector(".attributes-panel");
            var trigger = (_b = this.resizer) === null || _b === void 0 ? void 0 : _b.querySelector('[data-type="attributes"]');
            if (!panel || !trigger) {
                return;
            }
            var shouldShow = show !== null && show !== void 0 ? show : panel.hidden;
            if (shouldShow) {
                var isImage = this.resizeTarget.tagName.toLowerCase() === "img";
                var altField = panel.querySelector('[data-field="alt"]');
                if (altField) {
                    altField.style.display = isImage ? "" : "none";
                }
                var altInput = panel.querySelector('input[data-attr="alt"]');
                if (altInput) {
                    altInput.value = this.resizeTarget.getAttribute("alt") || "";
                }
                var titleInput = panel.querySelector('input[data-attr="title"]');
                if (titleInput) {
                    titleInput.value = this.resizeTarget.getAttribute("title") || "";
                }
                panel.hidden = false;
                trigger.setAttribute("aria-expanded", "true");
            }
            else {
                panel.hidden = true;
                trigger.setAttribute("aria-expanded", "false");
            }
        };
        /**
         * Applies the alt/title values currently entered in the attributes
         * panel to the resize target, persists them through Quill (if
         * available), fires onAttributesChange/onChange, and closes the panel.
         */
        ResizePlugin.prototype._saveAttributes = function () {
            var _a, _b, _c, _d, _e, _f, _g;
            var panel = (_a = this.resizer) === null || _a === void 0 ? void 0 : _a.querySelector(".attributes-panel");
            if (!panel) {
                return;
            }
            var isImage = this.resizeTarget.tagName.toLowerCase() === "img";
            var attrs = {};
            if (isImage) {
                var altInput = panel.querySelector('input[data-attr="alt"]');
                var alt = (_b = altInput === null || altInput === void 0 ? void 0 : altInput.value) !== null && _b !== void 0 ? _b : "";
                if (alt) {
                    this.resizeTarget.setAttribute("alt", alt);
                }
                else {
                    this.resizeTarget.removeAttribute("alt");
                }
                attrs.alt = alt;
            }
            var titleInput = panel.querySelector('input[data-attr="title"]');
            var title = (_c = titleInput === null || titleInput === void 0 ? void 0 : titleInput.value) !== null && _c !== void 0 ? _c : "";
            if (title) {
                this.resizeTarget.setAttribute("title", title);
            }
            else {
                this.resizeTarget.removeAttribute("title");
            }
            attrs.title = title;
            this._syncPersistence();
            this._toggleAttributesPanel(false);
            (_e = (_d = this.options) === null || _d === void 0 ? void 0 : _d.onAttributesChange) === null || _e === void 0 ? void 0 : _e.call(_d, this.resizeTarget, attrs);
            (_g = (_f = this.options) === null || _f === void 0 ? void 0 : _f.onChange) === null || _g === void 0 ? void 0 : _g.call(_f, this.resizeTarget);
        };
        ResizePlugin.prototype.startResize = function (e) {
            var _a, _b;
            var target = e.target;
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
                (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.onResizeStart) === null || _b === void 0 ? void 0 : _b.call(_a, this.resizeTarget);
            }
        };
        ResizePlugin.prototype.endResize = function (e) {
            var _a, _b, _c, _d, _e;
            var wasResizing = this.startResizePosition !== null;
            this.startResizePosition = null;
            if (e &&
                this.activePointerId !== null &&
                typeof ((_a = e.target) === null || _a === void 0 ? void 0 : _a.releasePointerCapture) === "function") {
                try {
                    e.target.releasePointerCapture(this.activePointerId);
                }
                catch (_f) {
                    // Ignore — capture may already have been released by the browser
                    // (e.g. on pointercancel) before we get here.
                }
            }
            this.activePointerId = null;
            if (wasResizing) {
                this._syncPersistence();
                (_c = (_b = this.options) === null || _b === void 0 ? void 0 : _b.onResizeEnd) === null || _c === void 0 ? void 0 : _c.call(_b, this.resizeTarget);
            }
            (_e = (_d = this.options) === null || _d === void 0 ? void 0 : _d.onChange) === null || _e === void 0 ? void 0 : _e.call(_d, this.resizeTarget);
        };
        ResizePlugin.prototype.resizing = function (e) {
            var _a, _b, _c, _d;
            if (!this.startResizePosition)
                return;
            var deltaX = e.clientX - this.startResizePosition.left;
            var deltaY = e.clientY - this.startResizePosition.top;
            var width = this.startResizePosition.width;
            var height = this.startResizePosition.height;
            width += deltaX;
            height += deltaY;
            if (e.altKey || ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.constraints) === null || _b === void 0 ? void 0 : _b.lockAspectRatio)) {
                var originSize = this.resizeTarget.originSize;
                var rate = originSize.height / originSize.width;
                height = rate * width;
            }
            var clamped = this._clampSize(width, height);
            this.resizeTarget.style.setProperty("width", clamped.width + "px");
            this.resizeTarget.style.setProperty("height", clamped.height + "px");
            this.positionResizerToTarget(this.resizeTarget);
            (_d = (_c = this.options) === null || _c === void 0 ? void 0 : _c.onResize) === null || _d === void 0 ? void 0 : _d.call(_c, this.resizeTarget, this._buildChangeEvent());
        };
        ResizePlugin.prototype.destroy = function () {
            var _a;
            this.container.removeChild(this.resizer);
            window.removeEventListener("pointerup", this.endResize);
            window.removeEventListener("pointercancel", this.endResize);
            window.removeEventListener("pointermove", this.resizing);
            (_a = this.scrollParent) === null || _a === void 0 ? void 0 : _a.removeEventListener("scroll", this.onScroll);
            this.scrollParent = null;
            this.resizer = null;
        };
        /**
         * @deprecated Use destroy() instead. Kept as an alias for backward
         * compatibility with any code calling the previous (misspelled) method
         * name directly.
         */
        ResizePlugin.prototype.destory = function () {
            this.destroy();
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
        /**
         * Stops tracking a single iframe (e.g. it was removed from the DOM or its
         * owning Quill instance was destroyed). Stops the shared polling interval
         * once no iframes are left, so destroying every Quill instance using this
         * module leaves no dangling timers behind.
         */
        IframeClick.untrack = function (element) {
            this.iframes = this.iframes.filter(function (item) { return item.element !== element; });
            if (this.iframes.length === 0 && this.interval) {
                clearInterval(this.interval);
                this.interval = null;
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
    /**
     * Merges the global `constraints` with any `constraintsByTag` override for
     * the given tag (per-tag fields win), so e.g. `video`/`iframe` embeds can
     * have a locked aspect ratio while `img` doesn't, without consumers having
     * to duplicate the whole constraints object per tag.
     */
    function resolveConstraints(tagName, options) {
        var _a;
        var perTag = (_a = options === null || options === void 0 ? void 0 : options.constraintsByTag) === null || _a === void 0 ? void 0 : _a[tagName];
        if (!(options === null || options === void 0 ? void 0 : options.constraints) && !perTag) {
            return undefined;
        }
        return __assign(__assign({}, options === null || options === void 0 ? void 0 : options.constraints), perTag);
    }
    var DEFAULT_EMBED_TAGS = ["img", "video"];
    /**
     * Determines which element (if any) should become the resize target for a
     * given click. Tries `options.resolveEmbed` first — letting consumers
     * support custom wrapper elements or arbitrary embed shapes without
     * forking the library — and falls back to matching `options.embedTags`
     * (default `["img", "video"]`) against the clicked element's own tag.
     */
    function resolveClickTarget(clickedTarget, event, options) {
        var _a, _b, _c;
        var resolved = (_a = options === null || options === void 0 ? void 0 : options.resolveEmbed) === null || _a === void 0 ? void 0 : _a.call(options, clickedTarget, event);
        if (resolved) {
            return resolved;
        }
        var embedTags = (_b = options === null || options === void 0 ? void 0 : options.embedTags) !== null && _b !== void 0 ? _b : DEFAULT_EMBED_TAGS;
        var tagName = (_c = clickedTarget === null || clickedTarget === void 0 ? void 0 : clickedTarget.tagName) === null || _c === void 0 ? void 0 : _c.toLowerCase();
        return tagName && embedTags.includes(tagName) ? clickedTarget : null;
    }
    function QuillResizeModule(quill, options) {
        var container = quill.root;
        var resizeTarge;
        var resizePlugin;
        var trackedIframes = new Set();
        // Enables width/height/align to persist through Quill Delta round trips
        // (getContents()/setContents()) instead of relying solely on inline
        // styles. No-ops for duck-typed/mock Quill instances that don't expose a
        // real Parchment-backed constructor.
        registerResizeFormats(quill.constructor);
        var pluginOptions = __assign(__assign({}, options), { __quillInstance: quill });
        var onContainerClick = function (e) {
            var clickedTarget = e.target;
            var target = resolveClickTarget(clickedTarget, e, options);
            if (target) {
                resizeTarge = target;
                resizePlugin = new ResizePlugin(target, container.parentElement, __assign(__assign({}, pluginOptions), { constraints: resolveConstraints(target.tagName.toLowerCase(), options) }));
            }
        };
        container.addEventListener("click", onContainerClick);
        var onTextChange = function (_delta, _oldDelta, _source) {
            // Re-scan iframes after each text change to (re)apply resize tracking
            container.querySelectorAll("iframe").forEach(function (item) {
                normalizeYouTubeIframe(item);
                trackedIframes.add(item);
                IframeClick.track(item, function () {
                    resizeTarge = item;
                    resizePlugin = new ResizePlugin(item, container.parentElement, __assign(__assign({}, pluginOptions), { constraints: resolveConstraints("iframe", options), 
                        // Don't steal focus onto the resize handle here: this callback
                        // fires from IframeClick's polling loop, which itself relies on
                        // `document.activeElement === iframe` to know the iframe is
                        // still the active target. Moving focus away immediately after
                        // construction would make that check think focus was lost,
                        // causing it to re-run this callback every poll tick instead of
                        // once per focus. img/video (activated via a plain "click", not
                        // a focus-polling loop) don't have this constraint.
                        __autoFocus: false }));
                });
            });
        };
        quill.on("text-change", onTextChange);
        var onOutsidePointerDown = function (e) {
            var _a, _b, _c;
            var target = e.target;
            if (target !== resizeTarge &&
                !((_b = (_a = resizePlugin === null || resizePlugin === void 0 ? void 0 : resizePlugin.resizer) === null || _a === void 0 ? void 0 : _a.contains) === null || _b === void 0 ? void 0 : _b.call(_a, target))) {
                (_c = resizePlugin === null || resizePlugin === void 0 ? void 0 : resizePlugin.destroy) === null || _c === void 0 ? void 0 : _c.call(resizePlugin);
                resizePlugin = null;
                resizeTarge = null;
            }
        };
        // "pointerdown" (rather than "mousedown") fires immediately for mouse,
        // touch, and pen alike, so tapping outside the active media on a touch
        // device closes the overlay just as promptly as a mouse click does.
        document.addEventListener("pointerdown", onOutsidePointerDown, {
            capture: true,
        });
        return {
            /**
             * Removes every listener this module registered (container click,
             * quill text-change, the document-wide outside-click watcher) and
             * destroys the active resizer overlay, if any. Also stops tracking any
             * iframes this instance registered with IframeOnClick, so the shared
             * polling interval it manages can be freed once no editor needs it.
             */
            destroy: function () {
                var _a, _b;
                container.removeEventListener("click", onContainerClick);
                (_a = quill.off) === null || _a === void 0 ? void 0 : _a.call(quill, "text-change", onTextChange);
                document.removeEventListener("pointerdown", onOutsidePointerDown, {
                    capture: true,
                });
                (_b = resizePlugin === null || resizePlugin === void 0 ? void 0 : resizePlugin.destroy) === null || _b === void 0 ? void 0 : _b.call(resizePlugin);
                resizePlugin = null;
                resizeTarge = null;
                trackedIframes.forEach(function (iframe) { return IframeClick.untrack(iframe); });
                trackedIframes.clear();
            },
        };
    }

    return QuillResizeModule;

}));
//# sourceMappingURL=quill-resize-module.js.map
