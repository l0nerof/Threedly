import { modelUploadMetadataSchema } from "@/src/business/schemas/modelUpload";
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
