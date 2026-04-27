import { modelUploadMetadataSchema } from "@/src/business/schemas/modelUpload";
import { describe, expect, it } from "../fixtures";

const validValues = {
  titleUa: "М'яке крісло",
  titleEn: "Soft chair",
  descriptionUa: "",
  descriptionEn: "",
  categoryId: "11111111-1111-4111-8111-111111111111",
  minimumPlan: "free",
};

describe("modelUploadMetadataSchema", () => {
  it("accepts valid bilingual draft metadata", () => {
    const result = modelUploadMetadataSchema.safeParse(validValues);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.descriptionUa).toBeNull();
      expect(result.data.descriptionEn).toBeNull();
    }
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
