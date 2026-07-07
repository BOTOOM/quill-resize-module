class Locale {
  altTip?: string;
  floatLeft?: string;
  floatRight?: string;
  center?: string;
  restore?: string;
  inputTip?: string;
  toolbarLabel?: string;
  handlerLabel?: string;
}
class I18n {
  config: Locale;
  constructor(config: Locale) {
    this.config = { ...defaultLocale, ...config };
  }
  findLabel(key: string): string | null {
    if (this.config) {
      return Reflect.get(this.config, key);
    }
    return null;
  }
}

const defaultLocale: Locale = {
  altTip: "Hold down the alt key to zoom",
  floatLeft: "Left",
  floatRight: "Right",
  center: "Center",
  restore: "Restore",
  inputTip: "Enter width percentage",
  toolbarLabel: "Media resize toolbar",
  handlerLabel:
    "Resize handle. Use arrow keys to resize, hold Alt to keep the aspect ratio, press 0 to restore the original size, Escape to close.",
};
export { I18n, Locale, defaultLocale };
