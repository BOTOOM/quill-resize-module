/**
 * Shared test helpers.
 *
 * jsdom does not implement layout, so `getBoundingClientRect()`,
 * `clientWidth`/`clientHeight` always resolve to 0, and `isContentEditable`
 * is not implemented at all (resolves to `undefined`). These helpers stub
 * those APIs so DOM-dependent logic (positioning, resize deltas, editable
 * checks) can be exercised deterministically in tests.
 */

export interface Box {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}

export function stubGeometry(el: HTMLElement, box: Box = {}): void {
  const { left = 0, top = 0, width = 0, height = 0 } = box;
  Object.defineProperty(el, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
      x: left,
      y: top,
      toJSON() {
        return this;
      },
    }),
  });
  Object.defineProperty(el, "clientWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(el, "clientHeight", {
    configurable: true,
    value: height,
  });
}

export function makeEditable(el: HTMLElement): void {
  Object.defineProperty(el, "isContentEditable", {
    configurable: true,
    value: true,
  });
}

/**
 * jsdom's PointerEvent does not default `button` for a synthetic
 * pointerdown the way a real browser would for a mouse/touch primary
 * contact, so this builds one with `button: 0` (primary button/contact)
 * pre-set, plus a default `pointerId` since production code reads it for
 * pointer capture.
 */
export function leftButtonPointerDown(
  init: PointerEventInit = {}
): PointerEvent {
  return new PointerEvent("pointerdown", {
    bubbles: true,
    button: 0,
    pointerId: 1,
    ...init,
  });
}
