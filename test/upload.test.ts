import { describe, expect, it } from "vitest";
import { compressImage, extractImageFiles } from "../src/upload";

function makeFile(
  name: string,
  type: string,
  content: string = "fake-bytes"
): File {
  return new File([content], name, { type });
}

// jsdom doesn't implement DataTransfer/DataTransferItemList, so FileList and
// DataTransferItemList are faked here as plain array-likes — extractImageFiles
// only relies on `.length`, indexed access, and (for items) `getAsFile()`.
function fakeFileList(files: File[]): FileList {
  return files as unknown as FileList;
}
function fakeDataTransferItemList(files: File[]): DataTransferItemList {
  return files.map((file) => ({
    getAsFile: () => file,
  })) as unknown as DataTransferItemList;
}

describe("extractImageFiles", () => {
  it("returns an empty array for null/undefined input", () => {
    expect(extractImageFiles(null)).toEqual([]);
    expect(extractImageFiles(undefined)).toEqual([]);
  });

  it("filters a FileList down to image files only", () => {
    const files = fakeFileList([
      makeFile("photo.png", "image/png"),
      makeFile("doc.pdf", "application/pdf"),
      makeFile("photo2.jpg", "image/jpeg"),
    ]);

    const result = extractImageFiles(files);

    expect(result).toHaveLength(2);
    expect(result.map((f) => f.name)).toEqual(["photo.png", "photo2.jpg"]);
  });

  it("supports a DataTransferItemList (drag items) via getAsFile()", () => {
    const items = fakeDataTransferItemList([
      makeFile("photo.png", "image/png"),
      makeFile("notes.txt", "text/plain"),
    ]);

    const result = extractImageFiles(items);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("photo.png");
  });
});

describe("compressImage", () => {
  it("returns the original file unchanged when options is false", async () => {
    const file = makeFile("a.png", "image/png");
    const result = await compressImage(file, false);
    expect(result).toBe(file);
  });

  it("returns the original file unchanged when options is undefined", async () => {
    const file = makeFile("a.png", "image/png");
    const result = await compressImage(file, undefined);
    expect(result).toBe(file);
  });

  it("gracefully falls back to the original file when canvas 2D context is unavailable (e.g. this test environment)", async () => {
    // jsdom doesn't implement a real 2D canvas context without the native
    // `canvas` package, so `getContext("2d")` returns null here — this
    // test asserts the documented graceful-degradation contract rather
    // than actual pixel compression.
    const file = makeFile("a.png", "image/png");
    const result = await compressImage(file, { maxWidth: 100 });
    expect(result).toBe(file);
  });
});
