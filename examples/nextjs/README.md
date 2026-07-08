# Next.js example

Quill (and therefore `quill-resize-module`) needs the DOM at construction
time, so it cannot run during Next.js server-side rendering. Load the
editor as a Client Component and skip SSR for it with `next/dynamic`.

## App Router (Next.js 13+)

```tsx
// app/editor/RichTextEditor.tsx
"use client";

import { useEffect, useRef } from "react";
import Quill from "quill";
import QuillResizeModule from "@botom/quill-resize-module";
import "quill/dist/quill.snow.css";

Quill.register("modules/resize", QuillResizeModule);

export default function RichTextEditor() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) {
      return;
    }

    const quill = new Quill(editorRef.current, {
      theme: "snow",
      modules: {
        toolbar: ["bold", "italic", "underline", "image", "video"],
        resize: { showSize: true },
      },
    });
    quillRef.current = quill;

    return () => {
      quill.getModule("resize")?.destroy?.();
      quillRef.current = null;
    };
  }, []);

  return <div ref={editorRef} />;
}
```

```tsx
// app/editor/page.tsx
import dynamic from "next/dynamic";

// ssr: false is required — Quill and this module reference `document`/
// `HTMLElement` at module-eval and construction time, which don't exist
// during server rendering.
const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
});

export default function EditorPage() {
  return <RichTextEditor />;
}
```

## Pages Router

Same idea: keep the component in `RichTextEditor.tsx` as above, and load
it with `dynamic(() => import("../components/RichTextEditor"), { ssr: false })`
from the page that needs it.

## Notes

- Uploading pasted/dropped images through your own Next.js API route
  pairs naturally with the module's `onImageUpload` hook:

  ```ts
  resize: {
    onImageUpload: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await res.json();
      return url;
    },
  }
  ```
- If you bundle CSS through a global stylesheet instead of a per-component
  import, add `quill/dist/quill.snow.css` to `app/globals.css` (or your
  `_app`'s global CSS) instead of importing it in the component.
