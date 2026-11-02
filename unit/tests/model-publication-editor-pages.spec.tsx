import en from "@/messages/en.json";
import ua from "@/messages/ua.json";
import PublicationPage, {
  metadata as draftMetadata,
} from "@/src/app/[locale]/(main-pages)/profile/uploads/[draftId]/page";
import PublicationDrafts from "@/src/app/[locale]/(main-pages)/profile/uploads/components/PublicationDrafts";
import NewPublicationPage, {
  metadata as newMetadata,
} from "@/src/app/[locale]/(main-pages)/profile/uploads/new/page";
import ProfileUploadsPage from "@/src/app/[locale]/(main-pages)/profile/uploads/page";
import { favoritesQueryKeys } from "@/src/business/queries/favorites";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { vi } from "vitest";
import {
  act,
  afterEach,
  beforeEach,
  describe,
  expect,
  fireEvent,
  it,
  render,
  screen,
  waitFor,
  within,
} from "../fixtures";
import { installMatchMediaMock } from "../mocks/match-media";
import {
  modelManagementMocks,
  modelManagementRouter,
} from "../mocks/model-management";
import {
  publicationDeferred,
  publicationRow,
} from "../mocks/model-publication";
import {
  EditorNavigationProvider,
  editorFixture,
  editorInitialData,
  installEditorBrowserApis,
  editorMocks as mocks,
  resetEditorMocks,
  setEditorDraft,
} from "../mocks/model-publication-editor";

vi.mock("@/src/business/utils/supabase/server", async () => ({
  createClient: (await import("../mocks/model-publication-editor")).editorMocks
    .serverClient,
}));
vi.mock("@/src/business/utils/supabase/client", async () => ({
  createClient: (await import("../mocks/model-publication-editor")).editorMocks
    .browserClient,
}));
vi.mock("next/cache", async () => ({
  revalidatePath: (await import("../mocks/model-publication-editor"))
    .editorMocks.revalidatePath,
}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  ...(
    await import("../mocks/model-management")
  ).createModelManagementNavigationMock(),
}));
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const { default: english } = await import("@/messages/en.json");
  const { default: ukrainian } = await import("@/messages/ua.json");
  return {
    setRequestLocale: vi.fn(),
    getTranslations: async ({ locale }: { locale: string }) =>
      createTranslator({
        locale,
        messages: locale === "ua" ? ukrainian : english,
        namespace: "Profile.uploads.editor",
      }),
  };
});
let client: QueryClient;
let cleanup: () => void;
let cleanupMedia: () => void;
beforeEach(() => {
  resetEditorMocks();
  cleanup = installEditorBrowserApis();
  cleanupMedia = installMatchMediaMock().cleanup;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55321");
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
  });
  client.setQueryData(favoritesQueryKeys.currentUser(), editorFixture.user.id);
  client.setQueryData(favoritesQueryKeys.sessionRevision(), 0);
});
afterEach(() => {
  client.clear();
  cleanup();
  cleanupMedia();
  vi.unstubAllEnvs();
});
const existing = (locale = "en", draftId = editorFixture.draftId) =>
  PublicationPage({ params: Promise.resolve({ locale, draftId }) });
const create = (locale = "en") =>
  NewPublicationPage({ params: Promise.resolve({ locale }) });
function show(content: ReactNode, locale: "ua" | "en" = "en") {
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        locale={locale}
        messages={locale === "ua" ? ua : en}
      >
        <EditorNavigationProvider>{content}</EditorNavigationProvider>
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe("publication editor routes", () => {
  it.each(["en", "ua"] as const)(
    "renders new and existing editors in %s without creating rows",
    async (locale) => {
      const first = show(await create(locale), locale);
      const t = (locale === "ua" ? ua : en).Profile.uploads.editor;
      expect(screen.getByRole("heading", { name: t.newTitle })).not.toBeNull();
      first.unmount();
      show(await existing(locale), locale);
      expect(screen.getByRole("heading", { name: t.editTitle })).not.toBeNull();
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it("keeps private editor routes out of search indexing", () => {
    expect(newMetadata.robots.index).toBe(false);
    expect(draftMetadata.robots.index).toBe(false);
  });
  it("rejects invalid locale/UUID before any data access", async () => {
    await expect(existing("en", "bad")).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
    await expect(create("bad")).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
    expect(mocks.serverClient).not.toHaveBeenCalled();
  });
  it("returns 404 for missing/foreign drafts without rendering private data", async () => {
    mocks.readSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(existing()).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
  });
  it.each(["en", "ua"])(
    "redirects guests to localized %s login",
    async (locale) => {
      modelManagementMocks.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
      await expect(existing(locale)).rejects.toMatchObject({
        digest: `NEXT_REDIRECT;replace;/${locale}/login;307;`,
      });
    },
  );
  it("shows a real failure rather than a fabricated empty editor", async () => {
    mocks.readSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "offline" },
    });
    show(await existing());
    expect(screen.getByRole("alert").textContent).toBe(
      en.Profile.uploads.editor.errors.generic,
    );
    expect(screen.queryByLabelText(en.Profile.uploads.form.titleEn)).toBeNull();
  });
  it("denies new creation after upload access is revoked but keeps an existing text editor", async () => {
    modelManagementMocks.profileSingle.mockResolvedValue({
      data: { id: editorFixture.user.id, can_upload: false },
      error: null,
    });
    const first = show(await create());
    expect(screen.getByRole("alert").textContent).toBe(
      en.Profile.uploads.editor.noUploadAccess,
    );
    expect(screen.queryByLabelText(en.Profile.uploads.form.titleEn)).toBeNull();
    first.unmount();
    show(await existing());
    expect(
      screen.getByLabelText(en.Profile.uploads.form.titleEn),
    ).toHaveProperty("disabled", false);
  });
});

describe("unfinished publication list", () => {
  const messages = en.Profile.uploads.editor;
  function showList(currentPage = 1) {
    const data = editorInitialData();
    return show(
      <PublicationDrafts
        ownerId={editorFixture.user.id}
        canUpload
        result={{
          ok: true,
          data: {
            drafts: [data.draft],
            totalCount: currentPage === 1 ? 1 : 6,
            currentPage,
            totalPages: currentPage,
          },
        }}
      />,
    );
  }
  function openDelete() {
    fireEvent.click(screen.getByRole("button", { name: messages.delete }));
    return screen.getByRole("alertdialog", {
      name: messages.confirm.delete.title,
    });
  }
  function confirmDelete() {
    fireEvent.click(
      within(
        screen.getByRole("alertdialog", {
          name: messages.confirm.delete.title,
        }),
      ).getByRole("button", { name: messages.confirmAction }),
    );
  }
  const storedDraft = () => ({
    ...editorInitialData().draft,
    source_asset_id: editorFixture.source.id,
    cover_asset_id: editorFixture.cover.id,
  });
  it("renders real draft title/state and a localized editor link", () => {
    const data = editorInitialData();
    show(
      <PublicationDrafts
        ownerId={editorFixture.user.id}
        canUpload
        result={{
          ok: true,
          data: {
            drafts: [data.draft],
            totalCount: 1,
            currentPage: 1,
            totalPages: 1,
          },
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Sofa" }),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("link", { name: en.Profile.uploads.editor.open })
        .getAttribute("href"),
    ).toBe(`/en/profile/uploads/${data.draft.id}`);
  });
  it("separates empty from failed lists and does not expose a stale account's drafts", () => {
    const first = show(
      <PublicationDrafts
        ownerId={editorFixture.user.id}
        canUpload
        result={{ ok: false, error: "timeout" }}
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      en.Profile.uploads.editor.errors.timeout,
    );
    expect(screen.queryByText(en.Profile.uploads.editor.noDrafts)).toBeNull();
    first.unmount();
    show(
      <PublicationDrafts
        ownerId={editorFixture.draftId}
        canUpload
        result={{
          ok: true,
          data: {
            drafts: [editorInitialData().draft],
            totalCount: 1,
            currentPage: 1,
            totalPages: 1,
          },
        }}
      />,
    );
    expect(screen.queryByRole("heading", { name: "Sofa" })).toBeNull();
  });
  it("keeps draft and model pagination independent", () => {
    show(
      <PublicationDrafts
        ownerId={editorFixture.user.id}
        canUpload
        result={{
          ok: true,
          data: {
            drafts: [editorInitialData().draft],
            totalCount: 6,
            currentPage: 1,
            totalPages: 2,
          },
        }}
      />,
    );
    fireEvent.click(
      screen.getByRole("link", { name: en.Profile.uploads.editor.nextDrafts }),
    );
    expect(modelManagementRouter.push).toHaveBeenCalledWith("?draftPage=2", {
      scroll: false,
    });
  });
  it("confirms deletion from the list and cancels without a write", () => {
    showList();
    const dialog = openDelete();
    expect(within(dialog).getByText("Sofa")).not.toBeNull();
    fireEvent.click(
      within(dialog).getByRole("button", { name: messages.stay }),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(modelManagementRouter.refresh).not.toHaveBeenCalled();
  });
  it("deletes through the existing server action and refreshes only after confirmation", async () => {
    showList();
    openDelete();
    confirmDelete();
    await screen.findByText(messages.draftList.deleted);
    expect(
      mocks.rpc.mock.calls.map(([, args]) => args.requested_operation),
    ).toEqual(["begin_delete", "cleanup", "finish_cleanup"]);
    expect(mocks.rpc.mock.calls[0][1]).toMatchObject({
      requested_draft_id: editorFixture.draftId,
      requested_revision: 0,
    });
    expect(modelManagementRouter.refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
  it("blocks duplicate confirmations while deletion is pending", async () => {
    showList();
    const response = publicationDeferred<void>();
    const implementation = mocks.rpcSingle.getMockImplementation();
    if (!implementation) throw new Error("Missing RPC fixture implementation");
    mocks.rpcSingle.mockImplementationOnce(async () => {
      await response.promise;
      return implementation();
    });
    openDelete();
    confirmDelete();
    confirmDelete();
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("article", { hidden: true })).not.toBeNull();
    expect(modelManagementRouter.refresh).not.toHaveBeenCalled();
    await act(async () => response.resolve(undefined));
    await screen.findByText(messages.draftList.deleted);
  });
  it("retains an incompletely deleted draft and allows a confirmed retry", async () => {
    showList();
    mocks.remove.mockResolvedValueOnce({
      data: null,
      error: { message: "offline" },
    });
    openDelete();
    confirmDelete();
    await screen.findByText(messages.draftList.deleteIncomplete);
    expect(screen.getByRole("heading", { name: "Sofa" })).not.toBeNull();
    expect(modelManagementRouter.refresh).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: messages.draftList.retryDelete }),
    );
    confirmDelete();
    await screen.findByText(messages.draftList.deleted);
    expect(modelManagementRouter.refresh).toHaveBeenCalledTimes(1);
  });
  it("requires rereading a conflict and confirming the updated revision again", async () => {
    showList();
    setEditorDraft({ title_en: "Changed elsewhere", revision: 7 });
    mocks.rpcSingle.mockResolvedValueOnce({
      data: publicationRow({ result: "conflict", revision: 7 }),
      error: null,
    });
    openDelete();
    confirmDelete();
    await screen.findByText(messages.draftList.deleteConflict);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: messages.delete })).toBeNull();
    mocks.countResult.mockResolvedValue({ count: 1, error: null });
    mocks.listResult.mockResolvedValue({
      data: [{ ...storedDraft(), title_en: "Changed elsewhere", revision: 7 }],
      error: null,
    });
    fireEvent.click(
      screen.getByRole("button", { name: messages.draftList.recheck }),
    );
    await screen.findByRole("heading", { name: "Changed elsewhere" });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    fireEvent.click(
      screen.getByRole("button", { name: messages.draftList.retryDelete }),
    );
    expect(
      within(screen.getByRole("alertdialog")).getByText("Changed elsewhere"),
    ).not.toBeNull();
    confirmDelete();
    await screen.findByText(messages.draftList.deleted);
    expect(mocks.rpc.mock.calls[1][1]).toMatchObject({ requested_revision: 7 });
  });
  it("keeps failed deletion blocked until a successful recheck and retry", async () => {
    showList();
    mocks.rpcSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "offline" },
    });
    openDelete();
    confirmDelete();
    await screen.findByText(messages.draftList.deleteFailed);
    mocks.countResult.mockResolvedValueOnce({
      count: null,
      error: { message: "offline" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: messages.draftList.recheck }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: messages.draftList.recheck }),
      ).toHaveProperty("disabled", false),
    );
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    mocks.countResult.mockResolvedValue({ count: 1, error: null });
    mocks.listResult.mockResolvedValue({ data: [storedDraft()], error: null });
    fireEvent.click(
      screen.getByRole("button", { name: messages.draftList.recheck }),
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: messages.draftList.retryDelete,
      }),
    );
    confirmDelete();
    await screen.findByText(messages.draftList.deleted);
  });
  it.each(["another account", "the same account after a session change"])(
    "ignores a late deletion response for %s",
    async (nextSession) => {
      showList();
      const response = publicationDeferred<{
        data: ReturnType<typeof publicationRow>;
        error: null;
      }>();
      mocks.rpcSingle.mockReturnValueOnce(response.promise);
      openDelete();
      confirmDelete();
      await waitFor(() => expect(mocks.rpc).toHaveBeenCalledTimes(1));
      await act(async () => {
        client.setQueryData(favoritesQueryKeys.sessionRevision(), 1);
        if (nextSession === "another account")
          client.setQueryData(
            favoritesQueryKeys.currentUser(),
            editorFixture.draftId,
          );
      });
      await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
      await act(async () =>
        response.resolve({
          data: publicationRow({ revision: 1, lifecycle: "deleting" }),
          error: null,
        }),
      );
      expect(modelManagementRouter.refresh).not.toHaveBeenCalled();
      expect(screen.queryByText(messages.draftList.deleted)).toBeNull();
    },
  );
  it("normalizes the last draft page on the server after confirmed deletion", async () => {
    showList(2);
    openDelete();
    confirmDelete();
    await screen.findByText(messages.draftList.deleted);
    mocks.countResult.mockResolvedValue({ count: 5, error: null });
    mocks.listResult.mockResolvedValue({
      data: Array.from({ length: 5 }, (_, index) => ({
        ...storedDraft(),
        id: `00000000-0000-0000-0000-00000000a10${index}`,
      })),
      error: null,
    });
    await expect(
      ProfileUploadsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({ page: "1", draftPage: "2" }),
      }),
    ).rejects.toMatchObject({
      digest:
        "NEXT_REDIRECT;replace;/en/profile/uploads?page=1&draftPage=1;307;",
    });
  });
});
