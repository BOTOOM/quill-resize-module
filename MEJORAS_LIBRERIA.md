# Analisis de mejoras para quill-resize-module

## Resumen ejecutivo

La libreria tiene una base util: soporta `img`, `video` e `iframe`, ya esta escrita en TypeScript, publica tipos, tiene un bundle pequeno y mantiene una experiencia visual correcta para resize. Sin embargo, hoy se siente mas como un overlay de DOM sobre Quill que como un modulo nativo de Quill 2.

La mejora mas importante no es agregar mas botones, sino volver el modulo mas confiable para produccion:

1. Persistencia real en Delta para alineacion y tamano.
2. Coherencia entre README, tipos y comportamiento real.
3. Mejor UX para mobile, touch, teclado y accesibilidad.
4. Mejor DX para frameworks y mantenimiento.

## Hallazgos principales dentro de la libreria

### 1. La API documentada no coincide con la implementacion

El README documenta opciones como `showToolbar`, `showSize`, `toolbar.sizeTools` y `toolbar.alingTools`:

- `README.md:91-149`

Pero el runtime actual renderiza un template fijo y no usa esas opciones para construir la UI:

- `src/ResizePlugin.ts:25-40`
- `src/ResizePlugin.ts:55-75`

Ademas, existe CSS para `.showSize`, pero esa pieza no se renderiza actualmente:

- `src/ResizePlugin.less:174-185`

### 2. El modulo no es realmente Quill-native

La alineacion y parte del resize dependen de estilos inline:

- `src/ResizePlugin.ts:158-169`

Eso explica directamente los issues abiertos donde la alineacion no persiste al exportar y restaurar Deltas:

- Issue `#13`: Enable Align functionality
- Issue `#14`: Align options are not stored in deltas

### 3. TypeScript existe, pero no es first-class

Las opciones publicas siguen demasiado abiertas:

- `src/main.ts:10-13`
- `src/ResizePlugin.ts:20-24`

Los tipos publicados tambien quedan por debajo de lo que promete la documentacion:

- `types/main.d.ts:1-12`
- `types/ResizePlugin.d.ts:16-34`

### 4. La calidad automatizada esta rota

Los tests actuales no prueban la libreria. Son restos de otro proyecto:

- `test/test.ts:1-53`
- `test/test.js:1-47`

El lint no corre con ESLint 9 porque el repo sigue usando `.eslintrc.js`:

- `.eslintrc.js:1-25`
- `package.json:87-88`

El workflow de CI tampoco valida lint ni tests reales:

- `.github/workflows/ci.yml:12-23`

### 5. La UX todavia es mouse-first

El resize usa eventos de mouse y no una capa moderna con pointer events:

- `src/ResizePlugin.ts:144-156`
- `src/ResizePlugin.ts:186-219`

Tampoco hay una capa accesible clara: se usan `<a>` como botones sin semantica de boton ni atributos ARIA:

- `src/ResizePlugin.ts:25-40`

### 6. Hay detalles de lifecycle y mantenimiento

- `IframeClick` mantiene un `setInterval` global sin cleanup explicito: `src/IframeClick.ts:7-23`
- El modulo registra listeners globales en `document` sin API publica de destruccion: `src/main.ts:93-107`
- Hay nombres publicos mal escritos como `destory` y `alingTools`, lo que baja la confianza de la API:
  - `src/main.ts:101`
  - `src/ResizePlugin.ts:221`
  - `README.md:99`

### 7. Packaging moderno incompleto

El paquete exporta bundles UMD como `main` y `module`, no ESM real:

- `package.json:5-15`
- `rollup.config.js:7-80`

Tampoco hay `peerDependencies` para `quill`, lo que puede generar instalaciones duplicadas o combinaciones no soportadas.

### 8. El demo no transmite estabilidad actual

El demo sigue apuntando a `quill@2.0.0-dev.3`:

- `demo/index.html:10-17`

Eso hace que el proyecto parezca menos actualizado de lo que realmente esta.

## Lo que hoy espera la comunidad en una libreria como esta

Segun el benchmark de npm, GitHub y librerias cercanas como `quill-resize-module`, `quill-image-resize-module` y `@enzedonline/quill-blot-formatter2`, los usuarios hoy esperan:

1. Persistencia en Delta para `align`, `width` y `height`.
2. Soporte real para Quill 2.
3. TypeScript serio: opciones tipadas, callbacks tipados, exports limpios.
4. Soporte touch/mobile con pointer events y mejor seleccion de handles.
5. Accesibilidad: teclado, foco visible, ARIA labels, botones reales.
6. Compatibilidad con React, Next.js, Vue y Angular.
7. Alt text, title y captions para imagenes.
8. Resize con limites: min/max, ratio lock, `%` vs `px`.
9. Soporte para custom embeds, no solo `img`, `video` e `iframe`.
10. Integracion con flujos reales: upload, compresion, callbacks de guardado.

## Benchmark rapido del ecosistema

| Paquete | Descargas aprox/mes | Senal principal |
| --- | ---: | --- |
| `@botom/quill-resize-module` | 13.4k | Base buena, pero aun inmadura como API de produccion |
| `quill-resize-module` | 61.2k | Resize mas configurable y mejor pensado para custom embeds |
| `@enzedonline/quill-blot-formatter2` | 81.8k | Referente moderno: Quill 2, mobile, captions, alt/title |
| `quill-image-resize-module` | 114.5k | Clasico historico, aun muy instalado |
| `frappe-quill-image-resize` | 143.6k | Mucha adopcion por distribucion y ecosistema |

## Mejoras priorizadas

## P0 - Criticas

### 1. Persistir alineacion y tamano como formato real de Quill

> ✅ Implementado: `src/formats.ts` registra attributors/blots dedicados
> (`width`, `height`, `resizeAlign`) y expone `registerResizeFormats()` /
> `syncResizeStateToQuill()`. Ver `test/persistence.test.ts` (9 tests contra
> el paquete real `quill`, cubriendo `getContents()`/`setContents()`
> roundtrip para imagenes, `videoFile` e iframes de video).

Objetivo:

- Hacer que `quill.getContents()` y `quill.setContents()` conserven alineacion y resize.

Propuesta:

- Crear formatos/attributors o blots propios para `align`, `width` y `height`.
- Evitar depender de inline style como fuente de verdad.
- Mantener compatibilidad con HTML restaurado, pero hacer que Delta sea el camino principal.

Impacto:

- Resuelve el principal problema funcional del producto.
- Da confianza para uso en produccion y editores persistidos.

### 2. Alinear README, runtime y tipos

Objetivo:

- Que toda opcion documentada exista de verdad y que toda opcion real este tipada.

Propuesta:

- Implementar o remover las opciones documentadas que hoy no se usan.
- Renombrar `alingTools` a `alignTools` y `destory` a `destroy`, manteniendo alias temporales por compatibilidad.
- Publicar interfaces reales de configuracion.

Impacto:

- Reduce confusion, issues repetidos y errores de integracion.

**✅ Implementado**: `showToolbar`, `showSize`, `toolbar.sizeTools` y
`toolbar.alignTools` ahora son opciones reales, leidas y aplicadas por
`ResizePlugin` (ver `applyToolbarVisibility()` en `src/ResizePlugin.ts`).
`toolbar.alingTools` (nombre historico con la errata) se mantiene como
alias deprecado con prioridad para `alignTools` si ambos se proveen.
`destory()` ya fue renombrado a `destroy()` con alias de compatibilidad
(ver seccion 13). Se publican `QuillResizeModuleOptions`, `ToolbarOptions`
y `ResizeModuleHandle` como exports nombrados desde `src/main.ts`/`types/main.d.ts`
en lugar de depender solo del escape hatch `[index: string]: any`. README
actualizado para usar `alignTools` en los ejemplos, documentando el alias
deprecado. Cubierto por 6 tests nuevos en
`describe("toolbar visibility options")` (`test/ResizePlugin.test.ts`).

### 3. Rehacer tests y quality gates

Objetivo:

- Tener validacion real de la libreria, no tests heredados.

Propuesta:

- Eliminar el test actual que no pertenece al proyecto.
- Agregar tests DOM para:
  - seleccion de media
  - resize
  - toolbar
  - persistencia de width/height/align
  - iframes
- Migrar ESLint a flat config o fijar una version compatible.
- Hacer que CI ejecute build + lint + tests.

Impacto:

- Baja riesgo en releases y mejora mantenibilidad.

## P1 - Muy importantes

### 4. Migrar a pointer events y mejorar mobile/touch

Objetivo:

- Que la libreria se sienta natural en desktop y mobile.

Propuesta:

- Cambiar `mousedown/mousemove/mouseup` por `pointerdown/pointermove/pointerup`.
- Soportar touch de forma nativa.
- Mejorar el tamano y area tactil del handle.
- Considerar soporte de pinch para video/imagen.

Impacto:

- Acerca el producto a lo que hoy ofrecen las mejores alternativas.

**✅ Implementado**: `ResizePlugin` ahora usa `pointerdown`/`pointermove`/
`pointerup`/`pointercancel` en lugar de `mousedown`/`mousemove`/`mouseup`,
unificando mouse, touch y pen bajo la misma API (`src/ResizePlugin.ts`).
El listener de "click fuera" en `src/main.ts` tambien pasa de `mousedown`
a `pointerdown`, para que cerrar el overlay responda igual de rapido en
touch que con mouse. Se agrega `setPointerCapture`/`releasePointerCapture`
(con feature-detection, ya que jsdom no los implementa) para que el drag
no se pierda si el puntero sale del pequeno `.handler` durante un touch
rapido. En CSS se agrega `touch-action: none` al handle para evitar que el
scroll nativo compita con el gesto de resize, y un `::before` invisible de
40x40px amplia el area tactil real sin cambiar el tamano visual del
handle (por debajo del minimo recomendado de ~44px si se usara solo el
tamano visible de 10x10px). Pinch-to-resize se deja fuera de este alcance
(anotado como posible extension futura, no bloquea el resto del plan).
Cubierto por 3 tests nuevos (touch pointer, pointercancel cleanup,
pointer capture) mas la migracion de los tests de drag existentes.

### 5. Accesibilidad y UX de teclado

Objetivo:

- Que el modulo sea usable sin mouse y mas amigable para mas usuarios.

Propuesta:

- Reemplazar anchors por botones reales.
- Agregar `aria-label`, `title`, `role` solo donde corresponda.
- Permitir mover foco al overlay y operar con teclado.
- Agregar atajos claros para ratio lock y restaurar.

Impacto:

- Mejora calidad percibida y compatibilidad en entornos serios.

**✅ Implementado**: el handle de resize y todos los botones del toolbar
ahora son elementos `<button type="button">` reales (antes eran `<a>` sin
`href`, no operables ni anunciados correctamente por lectores de
pantalla) — ver el `template` en `src/ResizePlugin.ts`. Se agrega
`role="toolbar"` + `aria-label` al toolbar, `aria-label` descriptivo al
handle (nueva clave de locale `handlerLabel`) y al input de ancho (clave
`inputTip` reutilizada). El foco se mueve automaticamente al handle
cuando el overlay se activa, permitiendo operar solo con teclado una vez
abierto (deshabilitable por instancia interna via `__autoFocus` para no
interferir con el polling de foco que usa `IframeClick` para videos
embebidos). Atajos de teclado en el handle: flechas para redimensionar
(paso de 1px, 10px con Shift), Alt+flecha para bloquear el ratio de
aspecto (igual que arrastrando con Alt), `0` para restaurar el tamano
original, y `Escape` para cerrar el overlay. El reset de estilos de
`<button>` en `ResizePlugin.less` preserva el look visual previo y
restaura un `:focus-visible` explicito (ya que `all: unset` lo elimina).

**Limitacion conocida y diferida**: activar el overlay por primera vez
sigue dependiendo de un click/foco previo sobre la imagen/video (no se
agrego `tabindex` automatico a `<img>`/`<video>` para hacerlos alcanzables
por Tab desde cero, ya que eso afectaria el orden de tabulacion de
cualquier pagina que use el editor). Queda anotado como candidato para una
futura iteracion de accesibilidad. Cubierto por 10 tests nuevos en
`describe("accessibility and keyboard interaction")`
(`test/ResizePlugin.test.ts`).

### 6. API publica mas limpia

Objetivo:

- Hacer que integrar el modulo sea simple y predecible.

Propuesta:

- Exportar interfaces como:
  - `ResizeModuleOptions`
  - `ToolbarOptions`
  - `ResizeConstraints`
  - `ResizeChangeEvent`
- Exponer callbacks bien definidos:
  - `onSelect`
  - `onResizeStart`
  - `onResize`
  - `onResizeEnd`
  - `onAlignChange`

Impacto:

- Mejora DX y permite integraciones avanzadas.

**✅ Implementado**: `QuillResizeModuleOptions`, `ToolbarOptions`,
`ResizeModuleHandle` y el nuevo `ResizeChangeEvent` se exportan como tipos
nombrados desde `src/main.ts`. Se agregaron los callbacks `onSelect`,
`onResizeStart`, `onResize`, `onResizeEnd` y `onAlignChange`, todos
aditivos junto al `onChange` existente (que sigue disparandose en todos
sus puntos de invocacion previos para mantener compatibilidad). `onResize`
recibe un `ResizeChangeEvent` tipado (`{ target, width, height, align }`)
en vez de obligar a leer `element.style` manualmente. `ResizeConstraints`
se implemento en el punto 8 (limites y modos de resize), junto con el
comportamiento real de min/max/lock, y tambien se exporta como tipo
nombrado. Cubierto con tests en
`describe("public callbacks")` (`test/ResizePlugin.test.ts`) y en
`test/main.test.ts`. Documentado en la nueva seccion "Callbacks" del
README.

## P2 - Diferenciacion

### 7. Alt text, title y captions

Objetivo:

- Salir de la categoria "solo resize" y entrar en "media formatting".

Propuesta:

- Agregar toolbar/modal para editar:
  - `alt`
  - `title`
  - caption opcional
- Permitir usar `title` como caption o definir un atributo dedicado.

Impacto:

- Es una mejora muy visible y de alto valor para usuarios finales.

### 8. Limites y modos de resize

Objetivo:

- Dar control real sobre el comportamiento del resize.

Propuesta:

- Agregar `minWidth`, `maxWidth`, `minHeight`, `maxHeight`.
- Agregar ratio fijo por tipo de embed.
- Permitir alternar entre `%` y `px`.
- Permitir presets configurables de tamano.

Impacto:

- Hace la libreria util en productos reales con layouts responsivos.

**✅ Implementado**: se agrego la opcion `constraints` (`minWidth`,
`maxWidth`, `minHeight`, `maxHeight`, `lockAspectRatio`) exportada como el
tipo `ResizeConstraints`, aplicada en drag por puntero, atajos de teclado
y (para `maxWidth`/`minWidth`) en las acciones de la toolbar en modo
`px`. Un piso absoluto de 30px se mantiene como red de seguridad aunque
se configure un `minWidth`/`minHeight` menor. `constraintsByTag` permite
sobreescribir `constraints` por tag (`img`/`video`/`iframe`) — por
ejemplo, forzar `lockAspectRatio` solo en videos/iframes. Se agrego
`toolbar.sizeUnit` (`"%"` por defecto o `"px"`) y `toolbar.sizePresets`
(por defecto `[100, 50]`, igual que el comportamiento previo) para
elegir el modo de tamano y las presets del toolbar. Cubierto por 9 tests
nuevos en `describe("resize constraints and modes")`
(`test/ResizePlugin.test.ts`) y un test de `constraintsByTag` en
`test/main.test.ts`. Documentado en la nueva seccion "Resize Constraints
& Modes" del README.

### 9. Custom embeds

Objetivo:

- Abrir la libreria a mas casos de uso sin forks.

Propuesta:

- Permitir configurar `embedTags` o un resolver custom para elementos redimensionables.
- Soportar mejor wrappers y embeds propios del usuario.

Impacto:

- Amplia el mercado objetivo sin romper la API principal.

### 10. Hooks de upload y compresion

Objetivo:

- Encajar mejor con flujos editoriales reales.

Propuesta:

- Ofrecer hooks para integrarse con upload pipelines.
- Considerar compresion opcional para imagenes pegadas o embebidas.

Impacto:

- Diferencia el producto y resuelve necesidades frecuentes.

## P3 - Pulido de producto

### 11. Packaging moderno

Propuesta:

- Publicar ESM real ademas de UMD.
- Declarar `peerDependencies` para `quill`.
- Revisar `exports` para importacion limpia en Node y bundlers modernos.

### 12. Demo y documentacion por framework

Propuesta:

- Actualizar demo a Quill estable.
- Agregar ejemplos oficiales para:
  - Vanilla
  - React
  - Next.js
  - Vue
  - Angular
- Documentar claramente limitaciones y compatibilidad.

### 13. Limpieza interna

> ✅ Implementado parcialmente: no existian archivos `.backup` para remover.
> Se renombro `destory()` a `destroy()` (con alias `destory()` deprecado por
> compatibilidad), se agrego un `destroy()` a nivel de modulo (retornado por
> `QuillResizeModule`, accesible tambien via `quill.getModule("resize")`)
> que limpia listeners de `container`/`document`/`quill.on("text-change")`
> y detiene el tracking de iframes, y se corrigio un listener de scroll
> anonimo que nunca se removia. El naming publico heredado (`alingTools` en
> README/demo) sigue pendiente como parte del punto 2 (alineacion de
> README/runtime/tipos).

Propuesta:

- Remover `src/ResizePlugin.ts.backup`.
- Corregir naming publico heredado.
- Agregar API de `destroy()` para limpiar listeners e intervalos.

## Roadmap sugerido

### Fase 1 - Confiabilidad

1. Persistencia en Delta.
2. README = tipos = runtime.
3. Tests reales.
4. Lint/CI funcionales.

### Fase 2 - UX moderna

1. Pointer events.
2. Mejor touch/mobile.
3. Accesibilidad.
4. Keyboard support.

### Fase 3 - Diferenciacion

1. Alt/title/caption.
2. Constraints avanzados.
3. Custom embeds.
4. Upload/compression hooks.

### Fase 4 - DX y adopcion

1. Packaging moderno.
2. Ejemplos por framework.
3. Demo y documentacion mejorados.

## Recomendacion final

Si solo se fuera a hacer una mejora primero, deberia ser esta:

**hacer que alineacion y tamano vivan en el modelo de Quill y sobrevivan a `getContents()` / `setContents()`**.

Ese cambio ataca el mayor problema funcional, resuelve los issues abiertos mas importantes y mueve la libreria de "plugin visual util" a "modulo confiable para produccion".
