# Examples

Official integration examples for `@botom/quill-resize-module`, one per
environment:

| Example | Description |
|---------|--------------|
| [`vanilla/`](./vanilla/index.html) | Plain HTML + CDN `<script>` tags, no build step. Open the file directly in a browser or serve it with any static server. |
| [`react/`](./react/README.md) | React (function component + hooks), including cleanup and Strict Mode notes. |
| [`nextjs/`](./nextjs/README.md) | Next.js App Router and Pages Router, with `next/dynamic`/`ssr: false` guidance (Quill needs a real DOM). |
| [`vue/`](./vue/README.md) | Vue 3, both `<script setup>` and Options API. |
| [`angular/`](./angular/README.md) | Angular component with `AfterViewInit`/`OnDestroy` lifecycle hooks. |

## Compatibility & limitations

- **Quill version**: requires Quill `^2.0.0` (declared as a
  `peerDependency`). Quill 1.x is not supported — this module relies on
  Quill 2's Parchment API for Delta-native persistence of width, height,
  alignment, alt text, and title.
- **DOM-only**: like Quill itself, this module reads `document`/
  `HTMLElement` at construction time and cannot run during server-side
  rendering. In SSR frameworks (Next.js, Nuxt, Angular Universal,
  SvelteKit, etc.), always create the editor on the client only — see
  the Next.js example above for the general pattern (dynamic import with
  SSR disabled) that applies to any SSR framework.
- **Module registration is global**: `Quill.register("modules/resize", ...)`
  should run once per page (module scope), not once per component
  instance, to avoid redundant re-registration.
- **Framework-agnostic core**: the module itself has no framework
  dependency — it only needs a Quill instance and, optionally, a plain
  options object. The examples above show idiomatic lifecycle wiring for
  each framework, but the module's public API (options, callbacks,
  `ResizeModuleHandle.destroy()`) is identical everywhere.
