class Locale {
  altTip?: string;
  floatLeft?: string;
  floatRight?: string;
  center?: string;
  restore?: string;
  inputTip?: string;
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
};
export { I18n, Locale, defaultLocale };
