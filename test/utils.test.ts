import { describe, it, expect } from "vitest";
import { format, getScrollParent } from "../src/utils";

describe("utils", () => {
  describe("format", () => {
    it("replaces indexed placeholders with provided values", () => {
      expect(format("Hello {0}, you are {1}", "world", "great")).toBe(
        "Hello world, you are great"
      );
    });

    it("replaces missing placeholders with an empty string", () => {
      expect(format("Hello {0} {1}", "world")).toBe("Hello world ");
    });

    it("supports out-of-order and repeated placeholders", () => {
      expect(format("{1}-{0}-{1}", "a", "b")).toBe("b-a-b");
    });
  });

  describe("getScrollParent", () => {
    it("returns null when given a null node", () => {
      expect(getScrollParent(null)).toBeNull();
    });

    it("returns the closest ancestor with scroll/auto overflow", () => {
      const scrollable = document.createElement("div");
      scrollable.style.overflowY = "auto";
      const child = document.createElement("div");
      const grandchild = document.createElement("span");
      scrollable.appendChild(child);
      child.appendChild(grandchild);
      document.body.appendChild(scrollable);

      expect(getScrollParent(grandchild)).toBe(scrollable);

      document.body.removeChild(scrollable);
    });

    it("falls back to body when no scrollable ancestor is found", () => {
      const node = document.createElement("div");
      document.body.appendChild(node);

      expect(getScrollParent(node)).toBe(document.body);

      document.body.removeChild(node);
    });
  });
});
