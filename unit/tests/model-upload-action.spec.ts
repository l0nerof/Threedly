import { uploadModelAction } from "@/src/app/[locale]/(main-pages)/profile/uploads/actions";
import { vi } from "vitest";
import { beforeEach, describe, expect, it } from "../fixtures";

const mocks = vi.hoisted(() => ({
  uploadMock: vi.fn(),
  removeMock: vi.fn(),
  insertModelSelectMock: vi.fn(),
  insertModelSingleMock: vi.fn(),
  insertModelFileMock: vi.fn(),
  deleteModelEqMock: vi.fn(),
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
      from: vi.fn(() => ({
        upload: mocks.uploadMock,
        remove: mocks.removeMock,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "models") {
        return {
          insert: vi.fn(() => ({
            select: mocks.insertModelSelectMock,
          })),
          delete: vi.fn(() => ({
            eq: mocks.deleteModelEqMock,
          })),
        };
      }

      return {
        insert: mocks.insertModelFileMock,
      };
    }),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function buildValidFormData(file: File): FormData {
  const formData = new FormData();
  formData.set("titleUa", "М'яке крісло");
  formData.set("titleEn", "Soft chair");
  formData.set("descriptionUa", "");
  formData.set("descriptionEn", "");
  formData.set("categoryId", "11111111-1111-4111-8111-111111111111");
  formData.set("minimumPlan", "free");
  formData.set("modelFile", file);

  return formData;
}

describe("uploadModelAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("uploads the file and saves model metadata", async () => {
    const result = await uploadModelAction(
      "ua",
      buildValidFormData(new File(["model"], "chair.glb")),
    );

    expect(result).toEqual({
      ok: true,
      modelId: "11111111-2222-3333-4444-555555555555",
    });
    expect(mocks.uploadMock).toHaveBeenCalledOnce();
    expect(mocks.insertModelFileMock).toHaveBeenCalledOnce();
  });

  it("rejects unsupported files before storage upload", async () => {
    const result = await uploadModelAction(
      "ua",
      buildValidFormData(new File(["model"], "chair.exe")),
    );

    expect(result).toEqual({ ok: false, error: "unsupportedFileType" });
    expect(mocks.uploadMock).not.toHaveBeenCalled();
  });

  it("removes the stored file if metadata save fails", async () => {
    mocks.insertModelSingleMock.mockResolvedValueOnce({
      data: null,
      error: { message: "insert failed" },
    });

    const result = await uploadModelAction(
      "ua",
      buildValidFormData(new File(["model"], "chair.glb")),
    );

    expect(result).toEqual({ ok: false, error: "metadataSaveFailed" });
    expect(mocks.removeMock).toHaveBeenCalledOnce();
  });
});
