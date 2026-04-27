import { catalogPlanKeys } from "@/src/business/constants/catalogConfig";
import { z } from "zod";

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(600, "errors.descriptionTooLong")
  .transform((value) => (value.length > 0 ? value : null));

export const modelUploadMetadataSchema = z.object({
  titleUa: z.string().trim().min(2, "errors.titleRequired").max(90),
  titleEn: z.string().trim().min(2, "errors.titleRequired").max(90),
  descriptionUa: optionalDescriptionSchema,
  descriptionEn: optionalDescriptionSchema,
  categoryId: z.string().uuid("errors.categoryRequired"),
  minimumPlan: z.enum(catalogPlanKeys),
});
