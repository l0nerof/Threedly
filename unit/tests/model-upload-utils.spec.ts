import {
  buildModelCoverImageStoragePath,
  buildModelPreviewStoragePath,
  buildModelUploadSlug,
  buildModelUploadStoragePath,
  getModelCoverImageExtension,
  getModelUploadFileExtension,
  sanitizeModelUploadFileName,
} from "@/src/business/utils/modelUpload";
import { describe, expect, it } from "../fixtures";

describe("model upload utils", () => {
  it("returns a supported extension in lowercase", () => {
    expect(getModelUploadFileExtension("Chair.GLB")).toBe("glb");
  });

  it("rejects unsupported or missing extensions", () => {
    expect(getModelUploadFileExtension("chair.exe")).toBeNull();
    expect(getModelUploadFileExtension("chair")).toBeNull();
  });

  it("sanitizes uploaded file names without changing the extension", () => {
    expect(sanitizeModelUploadFileName("Soft Chair Final.GLB")).toBe(
      "soft-chair-final.glb",
    );
  });

  it("builds a private user and model scoped storage path", () => {
    expect(
      buildModelUploadStoragePath({
        userId: "user-1",
        modelId: "model-1",
        fileName: "Soft Chair Final.GLB",
      }),
    ).toBe("user-1/model-1/soft-chair-final.glb");
  });

  it("returns a supported cover image extension from a MIME type", () => {
    expect(getModelCoverImageExtension("image/webp")).toBe("webp");
    expect(getModelCoverImageExtension("image/gif")).toBeNull();
  });

  it("builds a stable cover image storage path", () => {
    expect(
      buildModelCoverImageStoragePath({
        userId: "user-1",
        modelId: "model-1",
        mimeType: "image/jpeg",
      }),
    ).toBe("user-1/model-1/cover.jpg");
  });

  it("builds a lightweight viewer preview path", () => {
    expect(
      buildModelPreviewStoragePath({
        userId: "user-1",
        modelId: "model-1",
        fileName: "Preview.GLB",
      }),
    ).toBe("user-1/model-1/preview.glb");
  });

  it("builds a stable catalog-safe model slug", () => {
    expect(
      buildModelUploadSlug(
        "Soft Chair Final",
        "11111111-2222-3333-4444-555555555555",
      ),
    ).toBe("soft-chair-final-11111111");
  });
});
