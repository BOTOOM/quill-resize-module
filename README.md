# Quill Resize Module

A modern, secure module for the Quill rich text editor that allows you to resize images, videos, and iframes with comprehensive security updates and enhanced features.

![npm version](https://img.shields.io/npm/v/@botom/quill-resize-module)
![GitHub license](https://img.shields.io/github/license/BOTOOM/quill-resize-module)
![GitHub stars](https://img.shields.io/github/stars/BOTOOM/quill-resize-module)
![Security](https://img.shields.io/github/security-advisories/BOTOOM/quill-resize-module)

## ✨ Features

- 🖼️ **Image Resizing** - Resize images with drag handles
- 🎥 **Video Resizing** - Resize videos maintaining aspect ratio
- 📱 **Responsive Design** - Works on all devices
- 👆 **Touch & Pointer Support** - Unified pointer events for mouse, touch, and pen
- ⌨️ **Keyboard Accessible** - Real `<button>` controls, focus management, and keyboard shortcuts
- 🌐 **Multi-language Support** - Customizable locale options
- 🔒 **Security First** - Zero vulnerabilities, modern dependencies
- ⚡ **Performance Optimized** - Lightweight and fast
- 🎨 **Customizable Toolbar** - Show/hide alignment and size tools
- 📏 **Size Display** - Optional size indicator
- 🔔 **Typed Callbacks** - `onSelect`, `onResizeStart`, `onResize`, `onResizeEnd`, `onAlignChange`
- 📐 **Resize Constraints** - min/max width/height, aspect-ratio locking (globally or per embed tag), and `%`/`px` size modes with configurable presets

## 🚀 Demo

**Live Demo:** [https://botoom.github.io/quill-resize-module/](https://botoom.github.io/quill-resize-module/)

![Demo](https://raw.githubusercontent.com/BOTOOM/quill-resize-module/master/demo/demo.gif)

## 📦 Installation

```bash
npm install @botom/quill-resize-module
```

## 🛠️ Usage

### ES6/TypeScript

```javascript
import Quill from "quill";
import ResizeModule from "@botom/quill-resize-module";

Quill.register("modules/resize", ResizeModule);

const quill = new Quill("#editor", {
  modules: {
    resize: {
      showSize: true,
      locale: {
        altTip: "Hold down the alt key to zoom",
        floatLeft: "Left",
        floatRight: "Right", 
        center: "Center",
        restore: "Restore",
      },
    },
  },
});
```

### Browser (CDN)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quill Resize Module Demo</title>
  <link href="https://cdn.jsdelivr.net/npm/quill@2.0.0/dist/quill.snow.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/quill@2.0.0/dist/quill.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@botom/quill-resize-module@latest/dist/quill-resize-module.js"></script>
</head>
<body>
  <div id="editor"></div>
  <script>
    Quill.register("modules/resize", window.QuillResizeModule);
    
    const quill = new Quill("#editor", {
      modules: {
        toolbar: ["bold", "italic", "image", "video"],
        resize: {
          showSize: true,
          locale: {}
        }
      },
      theme: "snow"
    });
  </script>
</body>
</html>
```

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showToolbar` | boolean | `true` | Show/hide the toolbar |
| `showSize` | boolean | `false` | Display current dimensions as a floating label |
| `locale` | object | `{}` | Custom language strings |
| `toolbar.sizeTools` | boolean | `true` | Show size adjustment tools |
| `toolbar.alignTools` | boolean | `true` | Show alignment tools |
| `toolbar.sizePresets` | number[] | `[100, 50]` | Percentages rendered as quick-size preset buttons |
| `toolbar.sizeUnit` | `"%"` \| `"px"` | `"%"` | Unit applied by preset buttons and the width input (see [Resize Constraints & Modes](#-resize-constraints--modes)) |
| `constraints` | `ResizeConstraints` | `{}` | Min/max width & height and aspect-ratio locking, applied to every target (see below) |
| `constraintsByTag` | object | `{}` | Per-tag override of `constraints` (`{ img, video, iframe }`) |

> `toolbar.alingTools` (the original, misspelled name) still works as a
> deprecated alias for `toolbar.alignTools`, but new code should use the
> corrected name.


### Callbacks

| Callback | Signature | Fires when |
|----------|-----------|------------|
| `onChange` | `(element: HTMLElement) => void` | After any change (drag, keyboard resize, toolbar click/input). Kept for backward compatibility. |
| `onSelect` | `(element: HTMLElement) => void` | Once, when the overlay activates for a new img/video/iframe target. |
| `onResizeStart` | `(element: HTMLElement) => void` | When a resize gesture begins (pointer drag, keyboard arrow step, or a toolbar width action). |
| `onResize` | `(element: HTMLElement, event: ResizeChangeEvent) => void` | During a resize gesture. Fires on every `pointermove` for drags; once with the final size for keyboard/toolbar-driven resizes. |
| `onResizeEnd` | `(element: HTMLElement) => void` | When a resize gesture ends. |
| `onAlignChange` | `(element: HTMLElement, align: "left" \| "center" \| "right" \| null) => void` | When alignment changes via the toolbar. |

`ResizeChangeEvent` is `{ target: HTMLElement; width: number; height: number; align: "left" | "center" | "right" | null }`.

```typescript
import type { QuillResizeModuleOptions, ResizeChangeEvent } from "@botom/quill-resize-module";

const options: QuillResizeModuleOptions = {
  onSelect: (element) => console.log("selected", element),
  onResizeStart: (element) => console.log("resize start", element),
  onResize: (element, event: ResizeChangeEvent) => {
    console.log(`resizing to ${event.width}x${event.height}`, event.align);
  },
  onResizeEnd: (element) => console.log("resize end", element),
  onAlignChange: (element, align) => console.log("align changed", align),
};
```

### Locale Configuration

```javascript
const quill = new Quill("#editor", {
  modules: {
    resize: {
      locale: {
        altTip: "Hold down the alt key to zoom",
        floatLeft: "Left",
        floatRight: "Right",
        center: "Center",
        restore: "Restore",
      },
    },
  },
});
```

### Toolbar Customization

```javascript
// Hide alignment tools (e.g. for content pipelines that don't need it)
const quill = new Quill("#editor", {
  modules: {
    resize: {
      toolbar: {
        alignTools: false, // Hide alignment
        sizeTools: true,   // Keep size tools
      },
    },
  },
});
```

## 📐 Resize Constraints & Modes

Control the bounds and behavior of every resize gesture (pointer drag,
keyboard arrow steps, and `px`-unit toolbar actions):

```javascript
const quill = new Quill("#editor", {
  modules: {
    resize: {
      constraints: {
        minWidth: 80,
        maxWidth: 800,
        minHeight: 60,
        maxHeight: 600,
        lockAspectRatio: true, // always preserve ratio, without needing Alt
      },
      // Override constraints for specific embed tags — per-tag fields win
      // over the matching field in the global `constraints` above.
      constraintsByTag: {
        video: { lockAspectRatio: true },
        iframe: { lockAspectRatio: true, minWidth: 320 },
      },
    },
  },
});
```

> An absolute 30px minimum always applies as a safety floor, even if a
> smaller `minWidth`/`minHeight` is configured.

Toggle between relative (`%`) and absolute (`px`) sizing for the toolbar's
preset buttons and width input, and customize which percentages are
offered as presets:

```javascript
const quill = new Quill("#editor", {
  modules: {
    resize: {
      toolbar: {
        sizePresets: [100, 75, 50, 25], // default is [100, 50]
        sizeUnit: "px", // default is "%"; presets/input become fixed px sizes
      },
    },
  },
});
```

In `"%"` mode (the default) the preset buttons/input set a relative
`width: N%;`, so the embed keeps resizing with its container. In `"px"`
mode they compute an absolute width from the embed's original size
(e.g. 50% of a 200px-wide image becomes `width: 100px;`) and set
`height: auto;`, so the embed keeps a fixed size regardless of the
container's width. `minWidth`/`maxWidth` constraints are enforced on
`px`-mode preset/input changes.

## 🔧 Advanced Configuration

Combine toolbar visibility with the live size label:

```javascript
const quill = new Quill("#editor", {
  modules: {
    resize: {
      toolbar: {
        alignTools: false, // Disable alignment tools
      },
      showSize: true,
    },
  },
});
```

## ♿ Accessibility & Keyboard Shortcuts

The resize handle and every toolbar control are real `<button>` elements
(not anchors), so they are reachable and operable with a keyboard once
the overlay is active, and are announced correctly by screen readers.
When the overlay activates, focus moves to the resize handle automatically:

| Shortcut | Action |
|----------|--------|
| Arrow keys | Resize by 1px |
| Shift + Arrow keys | Resize by 10px |
| Alt + Arrow keys | Resize while keeping the original aspect ratio |
| `0` | Restore the original size |
| `Escape` | Close the overlay |

Touch and pen input are supported through Pointer Events, and the resize
handle has an enlarged (invisible) hit area for touch screens.

## 🐛 Bug Fixes & Security

### Recent Fixes
- ✅ **Fixed positioning** when nested inside relative elements (PR #12)
- ✅ **Security vulnerabilities** resolved (DOM Clobbering XSS, RCE)
- ✅ **Dependencies updated** to latest secure versions
- ✅ **Build system modernized** with Rollup v3

### Security Status
- 🔒 **0 vulnerabilities** (npm audit)
- 🛡️ **Modern dependencies** (no deprecated packages)
- ✅ **CI/CD security** with Node.js 20.x

## 📱 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 70+ |
| Firefox | 65+ |
| Safari | 12+ |
| Edge | 79+ |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention
This project follows [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning:

- `feat:` for new features
- `fix:` for bug fixes  
- `docs:` for documentation
- `style:` for formatting
- `refactor:` for code refactoring
- `test:` for tests
- `chore:` for maintenance

## 📋 Development

```bash
# Clone the repository
git clone https://github.com/BOTOOM/quill-resize-module.git
cd quill-resize-module

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📄 License

MIT © [Edwar Diaz](https://github.com/BOTOOM)

## 🔗 Related Projects

- [Quill.js](https://quilljs.com/) - Modern rich text editor
- [Quill Image Resize](https://github.com/kensnyder/quill-image-resize) - Alternative image resize module

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/BOTOOM/quill-resize-module?style=social)
![GitHub forks](https://img.shields.io/github/forks/BOTOOM/quill-resize-module?style=social)
![GitHub issues](https://img.shields.io/github/issues/BOTOOM/quill-resize-module)
![GitHub pull requests](https://img.shields.io/github/issues-pr/BOTOOM/quill-resize-module)
