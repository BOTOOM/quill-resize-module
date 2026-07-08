# React example

`quill-resize-module` works with any Quill 2.x setup, including React. The
key points for a React integration are:

- Create the Quill instance inside `useEffect` (Quill needs a real DOM
  node, so it can't be constructed during render).
- Register the module once, outside the component (or guard with a
  module-level flag) so repeated mounts don't re-register it.
- Call the returned handle's `destroy()` in the `useEffect` cleanup
  function to remove listeners when the component unmounts.

```tsx
import { useEffect, useRef } from "react";
import Quill from "quill";
import QuillResizeModule from "@botom/quill-resize-module";
import "quill/dist/quill.snow.css";

Quill.register("modules/resize", QuillResizeModule);

export function RichTextEditor() {
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
        resize: {
          showSize: true,
          constraints: { maxWidth: 800, lockAspectRatio: true },
          onAttributesChange: (element, attrs) => {
            console.log("alt/title updated", attrs);
          },
        },
      },
    });
    quillRef.current = quill;

    return () => {
      // `resize` is the module name passed to Quill.register, so
      // getModule("resize") returns the ResizeModuleHandle with destroy().
      quill.getModule("resize")?.destroy?.();
      quillRef.current = null;
    };
  }, []);

  return <div ref={editorRef} />;
}
```

## Notes

- `Quill.register` is idempotent for the same module reference, but keep
  it at module scope (as above) rather than inside the component body to
  avoid re-registering on every render.
- If you support React 18 Strict Mode's double-invoked effects in
  development, the `quillRef.current` guard above prevents creating two
  editor instances on the same DOM node.
- For TypeScript, import types with
  `import type { QuillResizeModuleOptions, ResizeChangeEvent } from "@botom/quill-resize-module";`.
