import ModelUploadForm from "@/src/app/[locale]/(main-pages)/profile/uploads/components/ModelUploadForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import {
  beforeEach,
  describe,
  expect,
  fireEvent,
  it,
  render,
  screen,
} from "../fixtures";

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
        studioBadge: "Upload Studio",
        sections: {
          files: "Model files",
          metadata: "Catalog description",
          settings: "Catalog and access",
        },
        fileZones: {
          coverTitle: "Catalog cover",
          coverDescription: "Add a JPG, PNG, or WEBP up to 5 MB.",
          modelTitle: "Primary model file",
          modelDescription:
            "GLB, GLTF, FBX, OBJ, MAX, BLEND, or ZIP up to 50 MB.",
          previewTitle: "Optional 3D preview",
          previewDescription: "GLB or GLTF for the future viewer.",
          empty: "Click to choose a file",
          selected: "File selected",
        },
        preview: {
          title: "Card preview",
          emptyTitle: "Model title",
          emptyCategory: "Category",
          coverReady: "Cover ready",
          coverMissing: "Waiting for cover",
        },
        readiness: {
          title: "Readiness",
          modelFile: "Model file",
          coverImage: "Cover image",
          titleUa: "Ukrainian title",
          titleEn: "English title",
          category: "Category",
          minimumPlan: "Access plan",
          complete: "Ready",
          missing: "Needed",
        },
        titleUa: "Ukrainian title",
        titleEn: "English title",
        descriptionUa: "Ukrainian description",
        descriptionEn: "English description",
        category: "Category",
        categoryPlaceholder: "Choose a category",
        categoryEmpty: "No categories found.",
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

beforeEach(() => {
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:cover-preview"),
      revokeObjectURL: vi.fn(),
    }),
  );
});

function renderModelUploadForm() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <ModelUploadForm
          categoryGroups={[
            {
              value: "furniture",
              label: "Furniture",
              categories: [
                {
                  id: "00000000-0000-0000-0000-000000000001",
                  value: "chairs",
                  label: "Chairs",
                },
              ],
            },
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

  it("uses a searchable category combobox instead of a large select menu", () => {
    renderModelUploadForm();

    expect(
      screen
        .getByRole("combobox", { name: /Category/i })
        .getAttribute("placeholder"),
    ).toBe("Choose a category");
  });

  it("renders upload studio sections, preview, and readiness checklist", () => {
    renderModelUploadForm();

    expect(screen.getByText("Upload Studio")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Model files" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Catalog description" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Catalog and access" }),
    ).toBeTruthy();
    expect(screen.getByText("Card preview")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Readiness" })).toBeTruthy();
  });

  it("shows the selected cover image file name in the styled file zone", () => {
    renderModelUploadForm();

    fireEvent.change(screen.getByLabelText(/Catalog cover/i), {
      target: {
        files: [new File(["cover"], "soft-chair.webp", { type: "image/webp" })],
      },
    });

    expect(screen.getByText("soft-chair.webp")).toBeTruthy();
    expect(screen.getByText("Cover ready")).toBeTruthy();
  });

  it("uses equal-height upload zones and the shared model card shell for preview", () => {
    const { container } = renderModelUploadForm();

    const fileZones = Array.from(
      container.querySelectorAll('[data-slot="upload-file-zone"]'),
    );

    expect(fileZones).toHaveLength(3);
    fileZones.forEach((fileZone) => {
      expect(fileZone.className).toContain("h-full");
      expect(fileZone.className).toContain("min-h-");
    });
    expect(
      container.querySelector('[data-slot="model-card-shell"]'),
    ).toBeTruthy();
  });
});
