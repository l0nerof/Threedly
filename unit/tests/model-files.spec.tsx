import enMessages from "@/messages/en.json";
import uaMessages from "@/messages/ua.json";
import FilesTab from "@/src/app/[locale]/(main-pages)/catalog/[slug]/components/FilesTab";
import { MODEL_FILES_LIMIT } from "@/src/business/constants/modelDownload";
import { fetchPublicModelFiles } from "@/src/business/utils/supabase/modelFiles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  fireEvent,
  it,
  render,
  screen,
  waitFor,
} from "../fixtures";
import {
  downloadActionMock,
  downloadUiFixture as fixture,
  modelFilesMocks as mocks,
  resetModelFilesMocks,
} from "../mocks/model-download-ui";

vi.mock("@/src/business/utils/supabase/server", async () => {
  const { modelFilesMocks } = await import("../mocks/model-download-ui");
  return { createClient: modelFilesMocks.createUserClient };
});
vi.mock("@/src/business/utils/supabase/admin", async () => {
  const { modelFilesMocks } = await import("../mocks/model-download-ui");
  return { createAdminClient: modelFilesMocks.createAdminClient };
});
vi.mock(
  "@/src/app/[locale]/(main-pages)/catalog/download-actions",
  async () => {
    const { downloadActionMock } = await import("../mocks/model-download-ui");
    return { downloadModelAction: downloadActionMock };
  },
);
vi.mock("next/navigation", async () => {
  const { createDownloadNavigationMock } =
    await import("../mocks/model-download-ui");
  return createDownloadNavigationMock();
});
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const { default: en } = await import("@/messages/en.json");
  const { default: ua } = await import("@/messages/ua.json");
  return {
    getTranslations: async ({ locale }: { locale: string }) =>
      createTranslator({
        locale,
        messages: locale === "ua" ? ua : en,
        namespace: "ModelPage.tabs",
      }),
  };
});

beforeEach(() => {
  resetModelFilesMocks();
  downloadActionMock
    .mockReset()
    .mockResolvedValue({ ok: false, error: "unauthorized" });
});
afterEach(() => vi.useRealTimers());

describe("public model file metadata", () => {
  it("reads only the scoped published model and returns only safe public columns", async () => {
    mocks.filesQuery.abortSignal.mockResolvedValueOnce({
      data: [
        {
          ...fixture.file,
          object_path: "private/object",
          bucket: "private-bucket",
          storage_provider: "supabase",
          model_id: fixture.modelId,
        },
      ],
      error: null,
    });
    expect(await fetchPublicModelFiles(fixture.modelId)).toEqual({
      ok: true,
      files: [fixture.file],
    });
    expect(mocks.userFrom).toHaveBeenCalledWith("models");
    expect(mocks.modelQuery.eq).toHaveBeenCalledWith("id", fixture.modelId);
    expect(mocks.modelQuery.eq).toHaveBeenCalledWith("status", "published");
    expect(mocks.adminFrom).toHaveBeenCalledWith("model_files");
    expect(mocks.filesQuery.select).toHaveBeenCalledWith(
      "id, file_name, format, file_size_bytes, is_primary",
    );
    expect(mocks.filesQuery.eq).toHaveBeenCalledWith(
      "model_id",
      fixture.modelId,
    );
    expect(mocks.filesQuery.eq).toHaveBeenCalledWith("bucket", "models");
    expect(mocks.filesQuery.eq).toHaveBeenCalledWith(
      "storage_provider",
      "supabase",
    );
    expect(mocks.filesQuery.order.mock.calls).toEqual([
      ["is_primary", { ascending: false }],
      ["created_at", { ascending: true }],
      ["id", { ascending: true }],
    ]);
    expect(mocks.filesQuery.limit).toHaveBeenCalledWith(MODEL_FILES_LIMIT + 1);
    expect(mocks.createAdminClient).toHaveBeenCalledWith(
      expect.any(AbortSignal),
    );
  });

  it("returns an empty list for a model no longer visible to the caller, without using the admin client", async () => {
    mocks.modelQuery.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    expect(await fetchPublicModelFiles(fixture.modelId)).toEqual({
      ok: true,
      files: [],
    });
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it.each(["not-a-guid", "", "../models"])(
    "rejects invalid model ID %s before querying",
    async (id) => {
      expect(await fetchPublicModelFiles(id)).toEqual({ ok: false });
      expect(mocks.createUserClient).not.toHaveBeenCalled();
      expect(mocks.createAdminClient).not.toHaveBeenCalled();
    },
  );

  it.each([
    { id: fixture.modelId, status: "draft" },
    { id: "00000000-0000-0000-0000-000000000999", status: "published" },
    { id: fixture.modelId },
  ])(
    "rejects unexpected model metadata before administrative reads",
    async (data) => {
      mocks.modelQuery.maybeSingle.mockResolvedValueOnce({ data, error: null });
      expect(await fetchPublicModelFiles(fixture.modelId)).toEqual({
        ok: false,
      });
      expect(mocks.createAdminClient).not.toHaveBeenCalled();
    },
  );

  it("does not leak raw database errors", async () => {
    mocks.modelQuery.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "private detail" },
    });
    expect(await fetchPublicModelFiles(fixture.modelId)).toEqual({ ok: false });
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("handles unavailable server credentials", async () => {
    mocks.createAdminClient.mockImplementationOnce(() => {
      throw new Error("private configuration");
    });
    expect(await fetchPublicModelFiles(fixture.modelId)).toEqual({ ok: false });
  });

  it("handles an unavailable request/session runtime", async () => {
    mocks.createUserClient.mockRejectedValueOnce(
      new Error("request unavailable"),
    );
    expect(await fetchPublicModelFiles(fixture.modelId)).toEqual({ ok: false });
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("handles a failed metadata query", async () => {
    mocks.filesQuery.abortSignal.mockResolvedValueOnce({
      data: null,
      error: { message: "read failed" },
    });
    expect(await fetchPublicModelFiles(fixture.modelId)).toEqual({ ok: false });
  });

  it.each([
    { data: null },
    { data: [{ ...fixture.file, file_size_bytes: -1 }] },
    { data: [{ ...fixture.file, file_size_bytes: 1.5 }] },
    {
      data: [{ ...fixture.file, file_size_bytes: Number.MAX_SAFE_INTEGER + 1 }],
    },
    { data: [{ ...fixture.file, file_name: "../private.obj" }] },
    { data: [{ ...fixture.file, file_name: "bad\nname.obj" }] },
    { data: [{ ...fixture.file, id: "wrong-id" }] },
    { data: [{ ...fixture.file, format: "" }] },
  ])(
    "rejects malformed metadata without returning a partial list",
    async ({ data }) => {
      mocks.filesQuery.abortSignal.mockResolvedValueOnce({ data, error: null });
      expect(await fetchPublicModelFiles(fixture.modelId)).toEqual({
        ok: false,
      });
    },
  );

  it("returns an empty result when the published model has no supported sources", async () => {
    mocks.filesQuery.abortSignal.mockResolvedValueOnce({
      data: [],
      error: null,
    });
    expect(await fetchPublicModelFiles(fixture.modelId)).toEqual({
      ok: true,
      files: [],
    });
  });

  it("rejects more than the bounded file limit rather than silently truncating", async () => {
    mocks.filesQuery.abortSignal.mockResolvedValueOnce({
      data: Array.from({ length: MODEL_FILES_LIMIT + 1 }, () => fixture.file),
      error: null,
    });
    expect(await fetchPublicModelFiles(fixture.modelId)).toEqual({ ok: false });
  });

  it("aborts a slow metadata read after ten seconds and clears its timer", async () => {
    vi.useFakeTimers();
    mocks.filesQuery.abortSignal.mockImplementationOnce(
      (signal: AbortSignal) =>
        new Promise((resolve) => {
          signal.addEventListener(
            "abort",
            () => resolve({ data: null, error: { message: "aborted" } }),
            { once: true },
          );
        }),
    );
    const result = fetchPublicModelFiles(fixture.modelId);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await result).toEqual({ ok: false });
    expect(vi.getTimerCount()).toBe(0);
  });
});

async function renderFiles(locale: "ua" | "en" = "en") {
  const content = await FilesTab({ modelId: fixture.modelId, locale });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <NextIntlClientProvider
        locale={locale}
        messages={locale === "ua" ? uaMessages : enMessages}
      >
        {content}
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe("FilesTab", () => {
  it("renders the actual filename, format, localized size and primary flag with an explicit download control", async () => {
    await renderFiles();
    expect(screen.getByText(fixture.file.file_name)).toBeTruthy();
    expect(screen.getByText("obj")).toBeTruthy();
    expect(screen.getByText("1.5 MB · Primary file")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Download chair.obj" }),
    ).toHaveProperty("disabled", false);
    fireEvent.click(screen.getByRole("button", { name: "Download chair.obj" }));
    await waitFor(() =>
      expect(downloadActionMock).toHaveBeenCalledWith({
        modelId: fixture.modelId,
        fileId: fixture.file.id,
      }),
    );
    expect(screen.queryByText("GLB file")).toBeNull();
  });

  it("localizes the file size and primary-file label in Ukrainian", async () => {
    await renderFiles("ua");
    const expectedSize = new Intl.NumberFormat("uk-UA", {
      style: "unit",
      unit: "megabyte",
      maximumFractionDigits: 2,
    }).format(1.5);
    expect(
      screen.getByText(
        `${expectedSize} · ${uaMessages.ModelPage.tabs.filesPrimary}`,
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Завантажити chair.obj" }),
    ).toBeTruthy();
  });

  it("shows an empty state without fictional downloadable formats", async () => {
    mocks.filesQuery.abortSignal.mockResolvedValueOnce({
      data: [],
      error: null,
    });
    await renderFiles();
    expect(screen.getByText(enMessages.ModelPage.tabs.filesEmpty)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows a recoverable failure state without download controls", async () => {
    mocks.filesQuery.abortSignal.mockResolvedValueOnce({
      data: null,
      error: { message: "private database error" },
    });
    await renderFiles();
    expect(screen.getByRole("alert").textContent).toBe(
      enMessages.ModelPage.tabs.filesError,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText("private database error")).toBeNull();
  });
});
