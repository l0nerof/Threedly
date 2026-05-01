import { uploadModelAction } from "@/src/app/[locale]/(main-pages)/profile/uploads/actions";
import { vi } from "vitest";
import { beforeEach, describe, expect, it } from "../fixtures";

const mocks = vi.hoisted(() => ({
  storageFromMock: vi.fn(),
  uploadMock: vi.fn(),
  removeMock: vi.fn(),
  insertModelMock: vi.fn(),
  insertModelSelectMock: vi.fn(),
  insertModelSingleMock: vi.fn(),
  insertModelFileMock: vi.fn(),
  deleteModelEqMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/src/business/utils/isLocaleCode", () => ({
  isLocaleCode: (value: string) => value === "ua" || value === "en",
}));

vi.mock("@/src/business/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "user-1" } },
      })),
    },
    storage: {
      from: mocks.storageFromMock,
    },
    from: vi.fn((table: string) => {
      if (table === "models") {
        return {
          insert: (payload: unknown) => {
            mocks.insertModelMock(payload);

            return {
              select: mocks.insertModelSelectMock,
            };
          },
          delete: vi.fn(() => ({
            eq: mocks.deleteModelEqMock,
          })),
        };
      }

      return {
        insert: (payload: unknown) => mocks.insertModelFileMock(payload),
      };
    }),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePathMock,
}));

type BuildValidFormDataOptions = {
  coverImage?: File;
  previewModelFile?: File;
};

function buildValidFormData(
  file: File,
  options: BuildValidFormDataOptions = {},
): FormData {
  const formData = new FormData();
  formData.set("titleUa", "Рњ'СЏРєРµ РєСЂС–СЃР»Рѕ");
  formData.set("titleEn", "Soft chair");
  formData.set("descriptionUa", "");
  formData.set("descriptionEn", "");
  formData.set("categoryId", "00000000-0000-0000-0000-000000000001");
  formData.set("minimumPlan", "free");
  formData.set("modelFile", file);
  formData.set(
    "coverImage",
    options.coverImage ??
      new File(["cover"], "cover.webp", { type: "image/webp" }),
  );

  if (options.previewModelFile) {
    formData.set("previewModelFile", options.previewModelFile);
  }

  return formData;
}

function getInsertedModelPayload(): Record<string, unknown> {
  const payload = mocks.insertModelMock.mock.calls[0]?.[0];
  expect(payload).toBeTruthy();

  return payload as Record<string, unknown>;
}

function getInsertedModelFilePayload(): Record<string, unknown> {
  const payload = mocks.insertModelFileMock.mock.calls[0]?.[0];
  expect(payload).toBeTruthy();

  return payload as Record<string, unknown>;
}

describe("uploadModelAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storageFromMock.mockImplementation((bucket: string) => ({
      upload: (path: string, file: File, options: unknown) =>
        mocks.uploadMock(bucket, path, file, options),
      remove: (paths: string[]) => mocks.removeMock(bucket, paths),
    }));
    mocks.uploadMock.mockResolvedValue({ error: null });
    mocks.removeMock.mockResolvedValue({ error: null });
    mocks.insertModelSelectMock.mockReturnValue({
      single: mocks.insertModelSingleMock,
    });
    mocks.insertModelSingleMock.mockResolvedValue({
      data: { id: "11111111-2222-3333-4444-555555555555" },
      error: null,
    });
    mocks.insertModelFileMock.mockResolvedValue({ error: null });
    mocks.deleteModelEqMock.mockResolvedValue({ error: null });
  });

  it("uploads the source file and cover image and saves model metadata", async () => {
    const result = await uploadModelAction(
      "ua",
      buildValidFormData(new File(["model"], "chair.glb")),
    );

    const modelPayload = getInsertedModelPayload();
    const modelId = String(modelPayload.id);

    expect(result).toEqual({
      ok: true,
      modelId: "11111111-2222-3333-4444-555555555555",
    });
    expect(mocks.storageFromMock).toHaveBeenCalledWith("models");
    expect(mocks.storageFromMock).toHaveBeenCalledWith("model-images");
    expect(mocks.uploadMock).toHaveBeenCalledTimes(2);
    expect(modelPayload.cover_image_path).toBe(`user-1/${modelId}/cover.webp`);
    expect(modelPayload.preview_model_path).toBeNull();
    expect(modelPayload.status).toBe("published");
    expect(modelPayload.published_at).toEqual(expect.any(String));

    const modelFilePayload = getInsertedModelFilePayload();
    expect(modelFilePayload.bucket).toBe("models");
    expect(modelFilePayload.object_path).toBe(`user-1/${modelId}/chair.glb`);
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith(
      "/ua/profile/uploads",
    );
    expect(mocks.revalidatePathMock).not.toHaveBeenCalledWith("/ua/catalog");
  });

  it("uploads an optional lightweight preview model and stores its path", async () => {
    await uploadModelAction(
      "ua",
      buildValidFormData(new File(["model"], "chair.blend"), {
        previewModelFile: new File(["preview"], "Preview.GLB"),
      }),
    );

    const modelPayload = getInsertedModelPayload();
    const modelId = String(modelPayload.id);

    expect(mocks.uploadMock).toHaveBeenCalledTimes(3);
    expect(modelPayload.preview_model_path).toBe(
      `user-1/${modelId}/preview.glb`,
    );
  });

  it("rejects unsupported files before storage upload", async () => {
    const result = await uploadModelAction(
      "ua",
      buildValidFormData(new File(["model"], "chair.exe")),
    );

    expect(result).toEqual({ ok: false, error: "unsupportedFileType" });
    expect(mocks.uploadMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported cover images before storage upload", async () => {
    const result = await uploadModelAction(
      "ua",
      buildValidFormData(new File(["model"], "chair.glb"), {
        coverImage: new File(["cover"], "cover.gif", { type: "image/gif" }),
      }),
    );

    expect(result).toEqual({ ok: false, error: "unsupportedCoverImageType" });
    expect(mocks.uploadMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported lightweight preview models before storage upload", async () => {
    const result = await uploadModelAction(
      "ua",
      buildValidFormData(new File(["model"], "chair.glb"), {
        previewModelFile: new File(["preview"], "preview.fbx"),
      }),
    );

    expect(result).toEqual({ ok: false, error: "unsupportedPreviewFileType" });
    expect(mocks.uploadMock).not.toHaveBeenCalled();
  });

  it("removes stored files if metadata save fails", async () => {
    mocks.insertModelSingleMock.mockResolvedValueOnce({
      data: null,
      error: { message: "insert failed" },
    });

    const result = await uploadModelAction(
      "ua",
      buildValidFormData(new File(["model"], "chair.glb"), {
        previewModelFile: new File(["preview"], "preview.glb"),
      }),
    );

    expect(result).toEqual({ ok: false, error: "metadataSaveFailed" });
    expect(mocks.removeMock).toHaveBeenCalledWith(
      "models",
      expect.arrayContaining([
        expect.stringMatching(/\/chair\.glb$/),
        expect.stringMatching(/\/preview\.glb$/),
      ]),
    );
    expect(mocks.removeMock).toHaveBeenCalledWith(
      "model-images",
      expect.arrayContaining([expect.stringMatching(/\/cover\.webp$/)]),
    );
  });
});
