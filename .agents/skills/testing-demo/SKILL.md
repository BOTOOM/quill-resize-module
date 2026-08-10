---
name: testing-quill-resize-demo
description: How to build quill-resize-module with npm/pnpm and exercise demo/index.html end-to-end in a browser (resize handles, size label, align/attributes toolbar, iframe resize).
---

# Testing the quill-resize-module demo

## Build
- npm lane: `npm run build` (= `rollup -c && tsc -p tsconfig.json`), `npm test`, `npm run lint`.
- pnpm lane: test it in a **separate clone** (e.g. `git clone --no-hardlinks <repo> /tmp/pnpmtest`) so
  `pnpm install` does not clobber the npm `node_modules` in the main checkout. Then
  `pnpm install && pnpm lint && pnpm build && pnpm test`.
- Adversarial control for the pnpm/`@types/node` issue: replacing
  `ReturnType<typeof setInterval>` with `NodeJS.Timeout` in `src/IframeClick.ts` must make
  `pnpm build` fail with `TS2503: Cannot find namespace 'NodeJS'`. If it doesn't fail, the pnpm
  lane isn't actually reproducing the original bug (e.g. @types/node got hoisted anyway).
- `pnpm install` regenerates `types/*.d.ts`; if a build failed mid-way those files can be left
  stale/modified — `git checkout .` and rebuild before judging generated output.

## Serving the demo
- `demo/index.html` is fully static: `cd demo && python3 -m http.server 8080`, open
  `http://localhost:8080/index.html`. No credentials, no dev server, no env vars.
- `demo/quill-resize-module.min.js` is gitignored and absent in a fresh clone; the release
  workflow does `cp dist/quill-resize-module.min.js demo/`. Test BOTH states:
  - absent → exercises the CDN-fallback path in the `<script>` tag
  - present → exercises the freshly built bundle (what GitHub Pages will serve)
- Known pitfall: a `<script src=...  onerror="this.src='<cdn>'">` fallback does **not** work —
  per the HTML spec the element's "already started" flag prevents a second fetch, so the CDN is
  never requested and `window.QuillResizeModule` stays undefined. Symptom: the Quill snow
  toolbar never renders and the console shows an uncaught TypeError from `Quill.register`.
  A `document.write`-based (or dynamically appended `<script>`) fallback does work.

## UI path for resize interactions
1. Click the image (or an `iframe.ql-video`) inside `#editor`.
2. Overlay DOM comes from `src/ResizePlugin.ts` template: `button.handler` (bottom-right drag
   handle), `span.size-label` (live "W x H", requires `showSize: true`), `div.toolbar` with
   `[data-group=size]` (100%/50%/%/Restore), `[data-group=align]` (Left/Center/Right/Restore)
   and `[data-group=attributes]` ("Edit alt text and title" → `div.attributes-panel`).
3. Drag with `mouse_move` → `left_mouse_down` → several `mouse_move`s → screenshot **while held**
   → `left_mouse_up`. `left_mouse_down` does not accept a coordinate; move first.
4. Iframes start at 300x150 until resized, so they look small in the page; that's expected.

## Environment gotchas (Devin box)
- `google-chrome <url>` is a shim that opens a tab in the managed Chrome (CDP on :29229).
  Passing flags launches a *separate* Chrome that the `browser_console`/`read_dom` tools cannot
  attach to. If the browser tools report "Could not connect to Chrome via CDP", make sure exactly
  one Chrome is running with `--remote-debugging-port=29229`; the first CDP call after a
  (re)connect may time out — just retry once.
- Maximize with `wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz` (not xdotool super+Up).

## Devin Secrets Needed
None.
