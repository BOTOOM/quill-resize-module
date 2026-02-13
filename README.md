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
- 🌐 **Multi-language Support** - Customizable locale options
- 🔒 **Security First** - Zero vulnerabilities, modern dependencies
- ⚡ **Performance Optimized** - Lightweight and fast
- 🎨 **Customizable Toolbar** - Show/hide alignment and size tools
- 📏 **Size Display** - Optional size indicator

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
| `showSize` | boolean | `false` | Display current dimensions |
| `locale` | object | `{}` | Custom language strings |
| `toolbar.sizeTools` | boolean | `true` | Show size adjustment tools |
| `toolbar.alingTools` | boolean | `true` | Show alignment tools |

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
// Hide alignment tools (for newer Quill versions)
const quill = new Quill("#editor", {
  modules: {
    resize: {
      toolbar: {
        alingTools: false,  // Hide alignment
        sizeTools: true,   // Keep size tools
      },
    },
  },
});
```

## 🔧 Advanced Configuration

For the latest versions of Quill that don't support the `style` attribute:

```javascript
const quill = new Quill("#editor", {
  modules: {
    resize: {
      toolbar: {
        alingTools: false,  // Disable alignment tools
      },
      showSize: true,
    },
  },
});
```

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
