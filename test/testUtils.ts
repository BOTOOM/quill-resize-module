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
 * jsdom's MouseEvent does not derive `which` from `button`/init options, so
 * left-button checks (`e.which === 1`) never pass with a plain
 * `new MouseEvent(...)`. This builds a mousedown event and forces `which`.
 */
export function leftButtonMouseDown(init: MouseEventInit = {}): MouseEvent {
  const event = new MouseEvent("mousedown", { bubbles: true, ...init });
  Object.defineProperty(event, "which", { configurable: true, value: 1 });
  return event;
}
