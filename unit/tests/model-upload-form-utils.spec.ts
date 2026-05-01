import {
  buildModelUploadFieldErrors,
  fieldError,
  readModelUploadFileValue,
  readModelUploadTextValue,
} from "@/src/business/utils/modelUploadForm";
import { describe, expect, it } from "../fixtures";

describe("model upload form utils", () => {
  it("reads text and file values from form data", () => {
    const file = new File(["model"], "chair.glb");
    const formData = new FormData();
    formData.set("titleEn", "Soft chair");
    formData.set("modelFile", file);

    expect(readModelUploadTextValue(formData, "titleEn")).toBe("Soft chair");
    expect(readModelUploadTextValue(formData, "missing")).toBe("");
    expect(readModelUploadFileValue(formData, "modelFile")).toBe(file);
  });

  it("builds one localized error per field from validation issues", () => {
    const errors = buildModelUploadFieldErrors(
      [
        { path: ["titleUa"], message: "errors.titleRequired" },
        { path: ["titleUa"], message: "errors.titleTooLong" },
        { path: ["categoryId"], message: "errors.categoryRequired" },
      ],
      (message) => `translated:${message}`,
    );

    expect(errors).toEqual({
      titleUa: "translated:errors.titleRequired",
      categoryId: "translated:errors.categoryRequired",
    });
  });

  it("normalizes optional field errors for FieldError", () => {
    expect(fieldError("Required")).toEqual([{ message: "Required" }]);
    expect(fieldError(undefined)).toEqual([]);
  });
});
