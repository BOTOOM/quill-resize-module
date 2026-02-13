class Iframe {
  public hasTracked: boolean = false;
  constructor(public element: HTMLIFrameElement, public cb: () => void) {}
}

class IframeClick {
  static resolution: number = 200;
  static iframes: Array<Iframe> = [];
  static interval: NodeJS.Timeout | null = null;

  static track(element: HTMLIFrameElement, cb: () => void) {
    const existing = this.iframes.find((item) => item.element === element);
    if (existing) {
      existing.cb = cb;
      return;
    }

    this.iframes.push(new Iframe(element, cb));
    if (!this.interval) {
      this.interval = setInterval(() => {
        IframeClick.checkClick();
      }, this.resolution);
    }
  }

  static checkClick() {
    const activeElement = document.activeElement;
    if (activeElement) {
      for (const item of this.iframes) {
        if (activeElement === item.element) {
          if (item.hasTracked === false) {
            item.cb();
            item.hasTracked = true;
          }
        } else {
          item.hasTracked = false;
        }
      }
    }
  }
}

export default IframeClick;
