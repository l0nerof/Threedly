import ModelUploadForm from "@/src/app/[locale]/(main-pages)/profile/uploads/components/ModelUploadForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import { describe, expect, it, render, screen } from "../fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

const messages = {
  Profile: {
    uploads: {
      form: {
        title: "New 3D model",
        description: "Upload a model.",
        titleUa: "Ukrainian title",
        titleEn: "English title",
        descriptionUa: "Ukrainian description",
        descriptionEn: "English description",
        category: "Category",
        categoryPlaceholder: "Choose a category",
        minimumPlan: "Minimum plan",
        plans: {
          free: "Free",
          pro: "Pro",
          max: "Max",
        },
        coverImage: "Preview image",
        coverImageHint: "JPG, PNG, or WEBP up to 5 MB.",
        file: "Model file",
        fileHint: "Supports common 3D formats up to 50 MB.",
        previewModelFile: "Lightweight 3D preview",
        previewModelFileHint: "Optional GLB or GLTF file.",
        submit: "Upload model",
        submitting: "Uploading...",
        success: "Model uploaded.",
        errors: {
          validationFailed: "Check the required fields.",
          titleRequired: "Title required.",
          titleTooLong: "Title too long.",
          descriptionTooLong: "Description too long.",
          categoryRequired: "Choose a category.",
          minimumPlanRequired: "Choose a minimum plan.",
          invalidMetadata: "Invalid metadata.",
          invalidFile: "Add a model file.",
          invalidCoverImage: "Add a preview image.",
          fileTooLarge: "File too large.",
          coverImageTooLarge: "Image too large.",
          previewFileTooLarge: "Preview file too large.",
          unsupportedFileType: "Unsupported file.",
          unsupportedCoverImageType: "Unsupported image.",
          unsupportedPreviewFileType: "Unsupported preview.",
          unauthorized: "Unauthorized.",
          uploadFailed: "Upload failed.",
          metadataSaveFailed: "Metadata save failed.",
          generic: "Something went wrong.",
        },
      },
    },
  },
};

function renderModelUploadForm() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <ModelUploadForm
          categories={[
            { id: "00000000-0000-0000-0000-000000000001", label: "Chairs" },
          ]}
          onUploadAction={vi.fn()}
        />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe("ModelUploadForm", () => {
  it("keeps the submit button enabled so Zod validation errors can be shown", () => {
    renderModelUploadForm();

    const submitButton = screen.getByRole("button", {
      name: "Upload model",
    }) as HTMLButtonElement;

    expect(submitButton.disabled).toBe(false);
  });
});
