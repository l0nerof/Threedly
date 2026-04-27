import {
  buildModelUploadSlug,
  buildModelUploadStoragePath,
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

  it("builds a stable catalog-safe draft slug", () => {
    expect(
      buildModelUploadSlug(
        "Soft Chair Final",
        "11111111-2222-3333-4444-555555555555",
      ),
    ).toBe("soft-chair-final-11111111");
  });
});
