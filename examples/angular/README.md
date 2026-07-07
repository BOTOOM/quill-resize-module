# Angular example

Create the Quill instance in `ngAfterViewInit` (once the template's DOM
node exists) and destroy the module handle in `ngOnDestroy`.

```typescript
// rich-text-editor.component.ts
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import Quill from "quill";
import QuillResizeModule, {
  type ResizeModuleHandle,
} from "@botom/quill-resize-module";
import "quill/dist/quill.snow.css";

Quill.register("modules/resize", QuillResizeModule);

@Component({
  selector: "app-rich-text-editor",
  template: `<div #editorEl></div>`,
})
export class RichTextEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild("editorEl", { static: true }) editorEl!: ElementRef<HTMLElement>;

  private quill?: Quill;

  ngAfterViewInit(): void {
    this.quill = new Quill(this.editorEl.nativeElement, {
      theme: "snow",
      modules: {
        toolbar: ["bold", "italic", "underline", "image", "video"],
        resize: {
          showSize: true,
          constraints: { maxWidth: 800, lockAspectRatio: true },
        },
      },
    });
  }

  ngOnDestroy(): void {
    const handle = this.quill?.getModule("resize") as
      | ResizeModuleHandle
      | undefined;
    handle?.destroy?.();
  }
}
```

## Notes

- Angular's zone-based change detection doesn't interfere with Quill's
  own DOM manipulation, but if you notice extra change-detection cycles
  from the module's internal listeners, wrap instantiation in
  `NgZone.runOutsideAngular(() => { ... })` and re-enter the zone only in
  the callbacks you actually need reactive updates for (`onChange`,
  `onAttributesChange`, etc.).
- `ViewChild({ static: true })` is required so `editorEl` is available in
  `ngAfterViewInit` (rather than `ngAfterContentInit`).
- Import types (`ResizeModuleHandle`, `ResizeChangeEvent`,
  `QuillResizeModuleOptions`, etc.) directly from
  `@botom/quill-resize-module` alongside the default export.
