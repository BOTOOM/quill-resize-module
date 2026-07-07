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

**✅ Implementado**: se agrego un boton "editar atributos" en la toolbar
(`toolbar.attributesTool`, por defecto `true`) que abre un panel con
campos `alt` (solo visible para `<img>`, ya que el resto de embeds no
tiene semantica nativa de alt) y `title` (disponible para cualquier
target). Al guardar, ambos valores se aplican como atributos HTML reales
y se persisten en el Delta de Quill mediante dos nuevos attributors
(`alt`/`title`, registrados con scope `ATTRIBUTE` en `src/formats.ts`),
sobreviviendo a `getContents()`/`setContents()` igual que
`width`/`height`/`resizeAlign`. Se agrego el callback
`onAttributesChange` (tipado con la nueva interfaz
`ResizeMediaAttributes`) y `Escape` dentro del panel lo cierra sin cerrar
el overlay completo. No se implemento un "caption" visible como texto
(figure/figcaption) en esta iteracion — se prioriza `title` como
alternativa mas simple y no invasiva, documentada en el README. Cubierto
por 8 tests nuevos en `describe("media attributes panel")`
(`test/ResizePlugin.test.ts`) y un test de persistencia end-to-end en
`test/persistence.test.ts` (guarda alt/title, verifica el Delta, y los
restaura en una instancia nueva de Quill). Documentado en la nueva
seccion "✏️ Media Attributes (Alt Text & Title)" del README.

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

**✅ Implementado**: se agrego la opcion `embedTags?: string[]` (por
defecto `["img", "video"]`, con semantica de reemplazo total, no merge)
para configurar que tags disparan el overlay de resize al hacer click, y
`resolveEmbed?: (clickedTarget, event) => HTMLElement | null | undefined`
como resolver custom que se evalua antes de `embedTags`, permitiendo
soportar wrappers propios (por ejemplo `clickedTarget.closest(".mi-embed")`)
sin fork. Ambas opciones aplican solo al flujo de click directo
(`onContainerClick`); el tracking de iframes sigue su mecanismo separado
de focus-polling ya existente, ya que los clicks dentro de contenido
cross-origin no burbujean al documento padre. La persistencia Quill-native
(`syncResizeStateToQuill` en `src/formats.ts`) ya era agnostica al tag
(usa `quill.constructor.find(target)` de Parchment), por lo que los
embeds custom obtienen persistencia en el Delta "gratis" si estan
respaldados por un blot. `constraintsByTag` se amplio de
`Partial<Record<"img"|"video"|"iframe", ResizeConstraints>>` a
`Partial<Record<string, ResizeConstraints>>` para soportar tags
arbitrarios. Cubierto por 3 tests nuevos en `test/main.test.ts`
(override completo de `embedTags`, resolver de wrapper custom via
`resolveEmbed`, y fallback a `embedTags` cuando `resolveEmbed` no
resuelve nada). Documentado en la nueva seccion "🧩 Custom Embeds" del
README.

### 10. Hooks de upload y compresion

Objetivo:

- Encajar mejor con flujos editoriales reales.

Propuesta:

- Ofrecer hooks para integrarse con upload pipelines.
- Considerar compresion opcional para imagenes pegadas o embebidas.

Impacto:

- Diferencia el producto y resuelve necesidades frecuentes.

**✅ Implementado**: nuevo modulo `src/upload.ts` con `extractImageFiles()`
y `compressImage()` (basado en `<canvas>`, con degradacion elegante si el
contexto 2D no esta disponible o si cualquier paso falla, devolviendo el
archivo original sin romper el flujo). `src/main.ts` agrega las opciones
`onImageUpload?: (file: File) => Promise<string> | string` e
`imageCompression?: ImageCompressionOptions | false`, y engancha listeners
de `paste`/`drop` sobre el contenedor del editor: si `onImageUpload` no
esta configurado, ambos listeners no hacen nada (sin `preventDefault`),
preservando el comportamiento nativo exacto para cualquier consumidor
existente. Cuando esta configurado, se filtran solo archivos de imagen,
se aplica `imageCompression` (si existe) antes de invocar
`onImageUpload`, y la URL resuelta se inserta en la posicion del cursor
via `insertEmbed`, avanzando la seleccion para insertar varios archivos
en orden. El `destroy()` del handle retorno tambien remueve ambos
listeners. Cubierto por `test/upload.test.ts` (6 tests para
`extractImageFiles`/`compressImage`, incluyendo el contrato de
degradacion elegante) y por un nuevo `describe("image upload hooks")` en
`test/main.test.ts` (7 tests: no-intercepcion sin `onImageUpload`, paste
y drop exitosos con insercion de URL, archivos no-imagen ignorados, URL
falsy que se salta la insercion, y limpieza de listeners tras
`destroy()`). README actualizado con la seccion "Upload Hooks &
Compression", tabla de opciones y bullet de features.

## P3 - Pulido de producto

### 11. Packaging moderno

Propuesta:

- Publicar ESM real ademas de UMD.
- Declarar `peerDependencies` para `quill`.
- Revisar `exports` para importacion limpia en Node y bundlers modernos.

**✅ Implementado**: se detecto que `dist/quill-resize-module.js` (apuntado
por `exports["."].import` y por el campo `module`) en realidad se
compilaba en formato UMD (`(function (global, factory) {...})`), no ESM
real — un problema real para bundlers/Node al resolver la condicion
`import`. Se agrega un tercer target en `rollup.config.js`
(`format: "es"`, salida `dist/quill-resize-module.esm.mjs`) que genera
`export`/`import` nativos; la extension `.mjs` hace que Node trate el
archivo como ESM sin depender del campo `type` del paquete (que sigue
siendo CommonJS por defecto, preservando compatibilidad). `package.json`
ahora tiene: `"module"` apuntando al nuevo build ESM real, y
`exports["."]` con `types` primero (orden requerido por la resolucion de
tipos de TypeScript), `import` -> el `.mjs`, y `require`/`default` -> el
UMD minificado existente (sin cambios para consumidores `require()`
actuales). Se agrega `dist/*.mjs` y `dist/*.map` a `files` para que
`npm pack` incluya el nuevo build y sus sourcemaps. `peerDependencies`
para `quill` ya existia previamente. Verificado con: `npm run build`,
`npm pack --dry-run` (confirma que el `.mjs` se incluye en el tarball),
y pruebas manuales de resolucion de paquete en un directorio temporal
con symlink (`require()` resuelve al UMD minificado, `import` nativo de
Node resuelve al `.mjs` real — ambos alcanzan el codigo del modulo,
fallando solo con el `ReferenceError: HTMLElement is not defined`
esperado y preexistente al ejecutarse fuera de un DOM real, igual que
con el build anterior). 107/107 tests, lint y audit sin cambios.

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

**✅ Implementado**: `demo/index.html` ahora carga Quill `2.0.3` (version
estable, la misma que la `devDependency`/`peerDependency` del proyecto)
desde `cdn.jsdelivr.net` con hashes SRI (`integrity`) recalculados,
reemplazando la version de desarrollo (`2.0.0-dev.3`) servida desde un
mirror de terceros poco confiable (`lib.baomitu.com`). El demo tambien
ejemplifica `toolbar.attributesTool` y `onImageUpload` (con
`URL.createObjectURL` como placeholder ilustrativo).

De paso se detecto y corrigio un bug real de despliegue: `demo/index.html`
referenciaba el modulo via `../dist/quill-resize-module.js`, una ruta
relativa que **no existe** una vez publicada, ya que
`.github/workflows/release.yml` solo publica el contenido de `./demo` a
`gh-pages` (sin `../dist`). El demo en vivo
(https://botoom.github.io/quill-resize-module/) en realidad seguia
funcionando solo porque una copia local desactualizada,
`demo/quill-resize-module.js`, habia quedado versionada en git desde un
commit anterior — pero esa copia jamas se actualizaba en cada release, y
el proximo despliegue habria mostrado un demo roto (script 404) al usar
la ruta `../dist/...`. Se elimino `demo/quill-resize-module.js` (copia
obsoleta) y el demo ahora carga el modulo publicado desde jsdelivr
(`https://cdn.jsdelivr.net/npm/@botom/quill-resize-module/...`), igual
que `examples/vanilla/index.html`, garantizando que el demo desplegado
siempre sea autosuficiente y refleje la ultima version publicada en npm.

Se agrega el directorio `examples/` con:

- `examples/vanilla/index.html`: HTML autonomo sin build step (CDN + `<script>`).
- `examples/react/README.md`, `examples/nextjs/README.md`,
  `examples/vue/README.md`, `examples/angular/README.md`: guias con
  codigo completo y idiomatico por framework, cubriendo creacion en el
  lifecycle hook correcto (`useEffect`/`ngAfterViewInit`/`onMounted`/
  `mounted`), limpieza via `quill.getModule("resize").destroy()`, y notas
  especificas (Next.js: `next/dynamic` con `ssr: false` porque el modulo
  depende de `document`/`HTMLElement`; React: guard contra doble efecto
  de Strict Mode).
- `examples/README.md`: indice de ejemplos + seccion "Compatibility &
  limitations" (version minima de Quill, incompatibilidad con SSR,
  registro global idempotente del modulo).

README enlaza `examples/` desde la seccion de Demo y agrega una nueva
seccion "🧬 Framework Compatibility" antes de "Contributing". No se
crearon proyectos scaffolded completos (con su propio `package.json`/
dependencias) para cada framework para mantener la estrategia
conservadora de no ampliar la superficie de dependencias del repositorio;
en su lugar se documentan ejemplos de codigo completos y copiables.

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

## Auditoria y remediacion de dependencias

> ✅ Implementado (estrategia conservadora, confirmada con el usuario):
> se partio de `npm audit` reportando 23 vulnerabilidades (1 baja, 8
> moderadas, 13 altas, 1 critica), todas en `devDependencies` (el paquete
> publicado no declara `dependencies` en runtime, solo `peerDependencies`
> para `quill`; `npm audit --omit=dev --audit-level=high` ya reportaba 0
> vulnerabilidades desde el inicio del proyecto). Acciones tomadas:
>
> 1. `npm audit fix` (no-breaking) resolvio 19 de las 23 automaticamente
>    — actualizaciones transitivas de `@sigstore/*`, `ajv`,
>    `brace-expansion`, `fast-uri`, `flatted`, `handlebars`, `ip-address`,
>    `js-yaml`, `lodash`/`lodash-es`, `minimatch`, `npm` (dependencia de
>    `@semantic-release/npm`), `picomatch`, `rollup`, `sigstore`, `svgo`,
>    `tar`, `undici` — todas dependencias del toolchain de
>    `semantic-release`/CI, nunca empaquetadas para consumidores.
> 2. `yaml@1.10.2` (moderado, *Stack Overflow via deeply nested YAML
>    collections*, rango afectado `>=1.0.0 <1.10.3`) quedaba en un estado
>    "invalid" por un conflicto de resolucion entre `rollup-plugin-postcss`
>    (via `cssnano`/`postcss-load-config`, que requieren `yaml@^1.10.2`) y
>    `vite` (que requiere `yaml@^2.4.2`). Se agrego un override quirurgico
>    en `package.json`: `"overrides": { "yaml@1.10.2": "1.10.3" }`, que
>    fuerza solo las ramas que resolvian a `1.10.2` a la ultima version
>    parche de la serie 1.x (`1.10.3`, dentro del rango que sus
>    `peerDependencies`/`dependencies` ya aceptaban), sin tocar la
>    resolucion de `vite`. Verificado con `npm ls yaml --all` (sin
>    entradas "invalid" y ambas rutas en `1.10.3 overridden`).
> 3. `@rollup/plugin-terser` se actualizo de `^0.4.4` a `^1.0.0`
>    (bump mayor de semver, pero solo usado en build-time para minificar
>    nuestro propio bundle — nunca se distribuye a consumidores) para
>    resolver una vulnerabilidad alta en `serialize-javascript`
>    (RCE via `RegExp.flags`/`toISOString`, y DoS por agotamiento de CPU).
>    `@rollup/plugin-terser@1.0.0` declara soporte para
>    `rollup ^2.0.0 || ^3.0.0 || ^4.0.0` (compatible con nuestro
>    `rollup@^3.29.0`, sin necesidad de subir de major alli) y requiere
>    Node `>=20`, ya satisfecho por los workflows de CI (`node-version:
>    '20.x'`/`'22.x'`) y por el entorno de desarrollo local. Verificado
>    reconstruyendo (`npm run build`), confirmando que el bundle
>    minificado sigue minificandose correctamente y el tamano se mantiene
>    igual (`npm run size`: 7.96 kB brotli, limite 15 kB).
> 4. `quill@2.0.3` (baja, *XSS via HTML export feature*,
>    [GHSA-v3m3-f69x-jf25](https://github.com/advisories/GHSA-v3m3-f69x-jf25))
>    queda **sin corregir intencionalmente**: es la ultima version
>    publicada de `quill` (no existe un release mas nuevo que la
>    solucione todavia) y el "fix" que ofrece `npm audit fix --force`
>    consiste en *bajar* a `quill@2.0.2` — lo cual no soluciona la causa
>    raiz (el advisory no confirma que `2.0.2` este libre del problema,
>    solo que esta fuera del rango afectado declarado) y podria perder
>    otras correcciones/funcionalidad de `2.0.3`. Ademas, `quill` es una
>    `peerDependency` (el consumidor final elige su propia version) y un
>    `devDependency` usado solo para ejecutar los tests de persistencia
>    contra el paquete real — nuestra libreria no invoca la funcion de
>    exportacion a HTML de Quill internamente. Se documenta como hallazgo
>    conocido, sin accion adicional hasta que exista un parche oficial
>    corriente arriba.
>
> Resultado final: `npm audit` paso de 23 a 1 vulnerabilidad (baja, sin
> fix disponible, documentada arriba); `npm audit --omit=dev
> --audit-level=high` se mantiene en 0. Validado con 107/107 tests (2
> corridas adicionales con `--sequence.shuffle` sin flake), lint (0
> errores), `npx tsc --noEmit` limpio, y `npm run build`/`npm run size`
> sin cambios de comportamiento.

## Bug critico encontrado post-implementacion: target ES5 rompia el bundle en navegador

> ✅ Corregido. Tras completar el plan, se detecto en pruebas manuales con
> Playwright (navegador real, no jsdom) que el modulo lanzaba
> `TypeError: Class constructor <X> cannot be invoked without 'new'` al
> inicializar Quill, impidiendo que el overlay de resize se activara del
> todo (imagenes/videos se veian, pero sin control de resize ni toolbar).
>
> **Causa raiz**: `tsconfig.json` y `tsconfig.rollup.json` tenian
> `"target": "es5"`. Al compilar `class ResizeStyleAttributor extends
> Parchment.StyleAttributor` (y las demas clases de `src/formats.ts` y
> `src/ResizePlugin.ts` que extienden clases nativas de Quill/DOM) a ES5,
> TypeScript usa el helper `__extends`, que invoca al constructor padre
> via `Parent.apply(this, arguments)` en vez de `super()`. Esto funciona
> si el padre tambien fue "downleveleado", pero Quill 2.x distribuye sus
> propias clases (`Parchment.StyleAttributor`, `Parchment.Attributor`,
> etc.) como clases ES6 nativas reales — y una clase nativa lanza ese
> `TypeError` si se invoca sin `new`.
>
> **Por que no lo detectaron los 107 tests**: la suite de Vitest importa
> el codigo fuente TypeScript directamente (transformado on-the-fly por
> Vite, que usa un target moderno), nunca pasa por el bundle real
> compilado con `tsconfig.rollup.json`. El bug solo se manifestaba en el
> artefacto publicado (`dist/*.js`), que es justo el que cargan todos los
> consumidores reales — un gap de cobertura relevante para el roadmap.
>
> **Fix**: se subio `target` a `"es2017"` en ambos tsconfigs (compatible
> con la matriz de navegadores ya declarada en el README — Chrome 70+,
> Firefox 65+, Safari 12+, Edge 79+ — todos soportan ES2017 nativo). Se
> reconstruyo el bundle y se verifico con Playwright contra
> `demo/index.html` servido localmente: 0 errores de consola, el overlay
> de resize se activa correctamente al hacer click en una imagen (bordes
> de seleccion, toolbar Left/Center/Right/Restore, boton "Edit alt text
> and title"). Se revalido con 107/107 tests, lint, `tsc --noEmit` y
> `npm audit` sin regresiones.

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
