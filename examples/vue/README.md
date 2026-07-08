# Vue 3 example

Use a template `ref` and create the Quill instance in `onMounted`, then
clean it up in `onBeforeUnmount`.

```vue
<!-- RichTextEditor.vue -->
<template>
  <div ref="editorEl"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import Quill from "quill";
import QuillResizeModule from "@botom/quill-resize-module";
import "quill/dist/quill.snow.css";

Quill.register("modules/resize", QuillResizeModule);

const editorEl = ref<HTMLElement | null>(null);
let quill: Quill | null = null;

onMounted(() => {
  if (!editorEl.value) {
    return;
  }
  quill = new Quill(editorEl.value, {
    theme: "snow",
    modules: {
      toolbar: ["bold", "italic", "underline", "image", "video"],
      resize: {
        showSize: true,
        constraints: { maxWidth: 800, lockAspectRatio: true },
      },
    },
  });
});

onBeforeUnmount(() => {
  quill?.getModule("resize")?.destroy?.();
  quill = null;
});
</script>
```

## Options API

```vue
<script>
import Quill from "quill";
import QuillResizeModule from "@botom/quill-resize-module";
import "quill/dist/quill.snow.css";

Quill.register("modules/resize", QuillResizeModule);

export default {
  mounted() {
    this.quill = new Quill(this.$refs.editorEl, {
      theme: "snow",
      modules: {
        toolbar: ["bold", "italic", "underline", "image", "video"],
        resize: { showSize: true },
      },
    });
  },
  beforeUnmount() {
    this.quill?.getModule("resize")?.destroy?.();
  },
};
</script>

<template>
  <div ref="editorEl"></div>
</template>
```

## Notes

- Vue's reactivity system doesn't need to observe the Quill/module
  instances directly — keep them as plain (non-reactive) `ref`/instance
  variables, as shown above, to avoid Vue trying to proxy internal Quill
  state.
- `Quill.register("modules/resize", QuillResizeModule)` at module scope
  keeps registration idempotent across multiple component instances.
