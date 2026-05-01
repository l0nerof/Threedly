import {
  modelUploadFormSchema,
  modelUploadMetadataSchema,
} from "@/src/business/schemas/modelUpload";
import { describe, expect, it } from "../fixtures";

const validValues = {
  titleUa: "М'яке крісло",
  titleEn: "Soft chair",
  descriptionUa: "",
  descriptionEn: "",
  categoryId: "00000000-0000-0000-0000-000000000001",
  minimumPlan: "free",
};

describe("modelUploadMetadataSchema", () => {
  it("accepts valid bilingual model metadata", () => {
    const result = modelUploadMetadataSchema.safeParse(validValues);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.descriptionUa).toBeNull();
      expect(result.data.descriptionEn).toBeNull();
    }
  });

  it("accepts the local seeded category id shape", () => {
    const result = modelUploadMetadataSchema.safeParse({
      ...validValues,
      categoryId: "00000000-0000-0000-0000-000000000004",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing titles", () => {
    const result = modelUploadMetadataSchema.safeParse({
      ...validValues,
      titleUa: "",
      titleEn: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid category ids", () => {
    const result = modelUploadMetadataSchema.safeParse({
      ...validValues,
      categoryId: "chairs",
    });

    expect(result.success).toBe(false);
  });
});

describe("modelUploadFormSchema", () => {
  const validFormValues = {
    ...validValues,
    modelFile: new File(["model"], "chair.glb"),
    coverImage: new File(["cover"], "cover.webp", { type: "image/webp" }),
    previewModelFile: null,
  };

  it("accepts valid metadata with required upload files", () => {
    const result = modelUploadFormSchema.safeParse(validFormValues);

    expect(result.success).toBe(true);
  });

  it("rejects missing required upload fields with field-level messages", () => {
    const result = modelUploadFormSchema.safeParse({
      ...validFormValues,
      titleUa: "",
      categoryId: "",
      modelFile: null,
      coverImage: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        titleUa: ["errors.titleRequired"],
        categoryId: ["errors.categoryRequired"],
        modelFile: ["errors.invalidFile"],
        coverImage: ["errors.invalidCoverImage"],
      });
    }
  });

  it("rejects unsupported cover image and preview model types", () => {
    const result = modelUploadFormSchema.safeParse({
      ...validFormValues,
      coverImage: new File(["cover"], "cover.gif", { type: "image/gif" }),
      previewModelFile: new File(["preview"], "preview.fbx"),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        coverImage: ["errors.unsupportedCoverImageType"],
        previewModelFile: ["errors.unsupportedPreviewFileType"],
      });
    }
  });
});
