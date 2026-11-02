import en from "@/messages/en.json";
import ua from "@/messages/ua.json";
import PublicationEditor from "@/src/app/[locale]/(main-pages)/profile/uploads/components/PublicationEditor";
import { favoritesQueryKeys } from "@/src/business/queries/favorites";
import type { PublicationEditorProps } from "@/src/business/types/modelPublicationEditor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
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
import { modelManagementRouter as router } from "../mocks/model-management";
import { publicationDeferred } from "../mocks/model-publication";
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

let client: QueryClient;
let cleanupBrowser: () => void;
let cleanupMedia: () => void;
const t = en.Profile.uploads.editor.preview;
beforeEach(() => {
  resetEditorMocks();
  cleanupBrowser = installEditorBrowserApis();
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
  cleanupBrowser();
  cleanupMedia();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function show(
  overrides: Partial<PublicationEditorProps> = {},
  locale: "en" | "ua" = "en",
) {
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        locale={locale}
        messages={locale === "ua" ? ua : en}
      >
        <EditorNavigationProvider>
          <PublicationEditor
            ownerId={editorFixture.user.id}
            canUpload
            categoryGroups={editorFixture.categories}
            initial={editorInitialData()}
            {...overrides}
          />
        </EditorNavigationProvider>
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}
function open() {
  fireEvent.click(screen.getByRole("button", { name: t.open }));
  return within(screen.getByRole("dialog", { name: t.title }));
}
function tab(element: HTMLElement) {
  fireEvent.mouseDown(element, { button: 0, ctrlKey: false });
  fireEvent.click(element);
}
function assertReadOnly() {
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.upload).not.toHaveBeenCalled();
  expect(mocks.copy).not.toHaveBeenCalled();
  expect(mocks.remove).not.toHaveBeenCalled();
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
}

describe("publication page preview in the real editor", () => {
  it.each(["en", "ua"] as const)(
    "places the return action before the preview heading and restores focus in %s",
    async (locale) => {
      show({}, locale);
      const labels = (locale === "ua" ? ua : en).Profile.uploads.editor.preview;
      const opener = screen.getByRole("button", { name: labels.open });
      opener.focus();
      fireEvent.click(opener);
      const dialog = screen.getByRole("dialog", { name: labels.title });
      const view = within(dialog);
      const back = view.getByRole("button", { name: labels.close });
      const heading = view.getByRole("heading", { name: labels.title });
      expect(
        back.compareDocumentPosition(heading) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).not.toBe(0);
      await waitFor(() =>
        expect(view.getByText("@creator_test")).not.toBeNull(),
      );
      fireEvent.click(back);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(document.activeElement).toBe(opener);
      assertReadOnly();
    },
  );
  it("opens the current unsaved title and description, retaining them after close", async () => {
    show();
    fireEvent.change(screen.getByLabelText(en.Profile.uploads.form.titleEn), {
      target: { value: "Unsaved sofa" },
    });
    fireEvent.change(
      screen.getByLabelText(en.Profile.uploads.form.descriptionEn),
      { target: { value: "Unsaved description" } },
    );
    const view = open();
    expect(
      view.getByRole("heading", { level: 1, name: "Unsaved sofa" }),
    ).not.toBeNull();
    expect(view.getByText("Unsaved description")).not.toBeNull();
    await waitFor(() => expect(view.getByText("@creator_test")).not.toBeNull());
    expect(view.getByText("CR")).not.toBeNull();
    expect(view.queryByRole("link")).toBeNull();
    expect(view.getByText(t.unpublished)).not.toBeNull();
    expect(
      view.getByRole("button", { name: t.downloadUnavailable }),
    ).toHaveProperty("disabled", true);
    fireEvent.click(view.getByRole("button", { name: t.close }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByLabelText(en.Profile.uploads.form.titleEn),
    ).toHaveProperty("value", "Unsaved sofa");
    expect(
      screen.getByRole("button", { name: en.Profile.uploads.editor.save }),
    ).toHaveProperty("disabled", false);
    assertReadOnly();
  });
  it("switches the current bilingual content without navigation or persistence", async () => {
    const saved = editorInitialData();
    saved.draft.description_ua = "Український опис";
    saved.draft.description_en = "English description";
    show({ initial: saved });
    const view = open();
    fireEvent.click(view.getByRole("button", { name: "Українська" }));
    expect(
      view.getByRole("heading", { name: "Диван", level: 1 }),
    ).not.toBeNull();
    expect(view.getByText("Український опис")).not.toBeNull();
    expect(
      view
        .getByRole("button", { name: "Українська" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(view.getByRole("button", { name: "English" }));
    expect(view.getByText("English description")).not.toBeNull();
    assertReadOnly();
  });
  it.each(["en", "ua"] as const)(
    "shows explicit empty-draft states in %s, never fake content",
    (locale) => {
      resetEditorMocks(true);
      show({ initial: null }, locale);
      const labels = (locale === "ua" ? ua : en).Profile.uploads.editor.preview;
      fireEvent.click(screen.getByRole("button", { name: labels.open }));
      const view = within(screen.getByRole("dialog", { name: labels.title }));
      expect(
        view.getByRole("heading", { level: 1, name: labels.emptyTitle }),
      ).not.toBeNull();
      expect(view.getByText(labels.emptyDescription)).not.toBeNull();
      expect(view.getByText(labels.emptyCover)).not.toBeNull();
      tab(
        view.getByRole("tab", {
          name: (locale === "ua" ? ua : en).ModelPage.tabs.filesAndFormats,
        }),
      );
      expect(view.getByText(labels.emptySource)).not.toBeNull();
      expect(view.queryByRole("listitem")).toBeNull();
      expect(mocks.createSignedUrl).not.toHaveBeenCalled();
      assertReadOnly();
    },
  );
  it("uses selected local files and releases only the preview's blob URL on close", async () => {
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:http://localhost/editor-cover")
      .mockReturnValueOnce("blob:http://localhost/page-cover");
    show();
    fireEvent.change(
      screen.getByLabelText(en.Profile.uploads.editor.chooseCover),
      {
        target: {
          files: [new File(["png"], "fresh.png", { type: "image/png" })],
        },
      },
    );
    fireEvent.change(
      screen.getByLabelText(en.Profile.uploads.editor.chooseSource),
      { target: { files: [new File(["o sofa"], "fresh.obj")] } },
    );
    const view = open();
    expect(view.getByRole("img", { name: "Sofa" }).getAttribute("src")).toBe(
      "blob:http://localhost/page-cover",
    );
    tab(view.getByRole("tab", { name: en.ModelPage.tabs.filesAndFormats }));
    expect(view.getByText("fresh.obj")).not.toBeNull();
    for (const button of view.getAllByRole("button", {
      name: t.downloadUnavailable,
    }))
      expect(button).toHaveProperty("disabled", true);
    fireEvent.click(view.getByRole("button", { name: t.close }));
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      "blob:http://localhost/page-cover",
    );
    expect(screen.getByRole("img", { name: "Sofa" }).getAttribute("src")).toBe(
      "blob:http://localhost/editor-cover",
    );
    expect(screen.getByText("fresh.obj")).not.toBeNull();
    expect(mocks.createSignedUrl).not.toHaveBeenCalled();
    assertReadOnly();
  });
  it("shows a profile failure separately and supports explicit retry", async () => {
    mocks.authorSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "private error" },
    });
    show();
    const view = open();
    await waitFor(() => expect(view.getByText(t.authorError)).not.toBeNull());
    expect(view.queryByText("private error")).toBeNull();
    expect(
      view.getByRole("heading", { name: "Sofa", level: 1 }),
    ).not.toBeNull();
    fireEvent.click(view.getByRole("button", { name: t.retryAuthor }));
    await waitFor(() => expect(view.getByText("@creator_test")).not.toBeNull());
    assertReadOnly();
  });
  it("renews a failed signed cover without saving or changing local text", async () => {
    show();
    fireEvent.change(screen.getByLabelText(en.Profile.uploads.form.titleEn), {
      target: { value: "Keep local title" },
    });
    const view = open();
    const image = await view.findByRole("img", { name: "Keep local title" });
    fireEvent.error(image);
    expect(view.getByText(t.coverError)).not.toBeNull();
    fireEvent.click(view.getByRole("button", { name: t.retryCover }));
    await waitFor(() =>
      expect(
        view.getByRole("img", { name: "Keep local title" }),
      ).not.toBeNull(),
    );
    fireEvent.click(view.getByRole("button", { name: t.close }));
    expect(
      screen.getByLabelText(en.Profile.uploads.form.titleEn),
    ).toHaveProperty("value", "Keep local title");
    expect(mocks.createSignedUrl).toHaveBeenCalledTimes(2);
    assertReadOnly();
  });
  it("keeps a failed cover recoverable and never replaces it with another device's asset", async () => {
    mocks.createSignedUrl.mockResolvedValueOnce({
      data: null,
      error: { message: "expired" },
    });
    show();
    const view = open();
    await waitFor(() => expect(view.getByText(t.coverError)).not.toBeNull());
    setEditorDraft({ cover_asset_id: editorFixture.source.id }, [
      editorFixture.source,
      { ...editorFixture.cover, id: editorFixture.source.id },
    ]);
    fireEvent.click(view.getByRole("button", { name: t.retryCover }));
    await waitFor(() => expect(mocks.readSingle).toHaveBeenCalledTimes(2));
    expect(view.queryByRole("img", { name: "Sofa" })).toBeNull();
    expect(view.getByText(t.coverError)).not.toBeNull();
    assertReadOnly();
  });
  it("returns focus to the opener on Escape and previews newer edits on reopen", async () => {
    show();
    const opener = screen.getByRole("button", { name: t.open });
    opener.focus();
    const view = open();
    await waitFor(() => expect(view.getByText("@creator_test")).not.toBeNull());
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(opener);
    fireEvent.change(screen.getByLabelText(en.Profile.uploads.form.titleEn), {
      target: { value: "Newer edits" },
    });
    expect(
      open().getByRole("heading", { level: 1, name: "Newer edits" }),
    ).not.toBeNull();
    assertReadOnly();
  });
  it("ignores a late author response after close and starts a new read on reopen", async () => {
    const pending = publicationDeferred<{
      data: typeof editorFixture.author;
      error: null;
    }>();
    mocks.authorSingle.mockReturnValueOnce(pending.promise);
    show();
    const view = open();
    await waitFor(() => expect(mocks.authorSingle).toHaveBeenCalledOnce());
    fireEvent.click(view.getByRole("button", { name: t.close }));
    await act(async () =>
      pending.resolve({
        data: { ...editorFixture.author, username: "stale_author" },
        error: null,
      }),
    );
    const reopened = open();
    await waitFor(() =>
      expect(reopened.getByText("@creator_test")).not.toBeNull(),
    );
    expect(reopened.queryByText("@stale_author")).toBeNull();
    assertReadOnly();
  });
  it("unmounts preview and ignores in-flight private reads when the account changes", async () => {
    const pending = publicationDeferred<{
      data: typeof editorFixture.author;
      error: null;
    }>();
    mocks.authorSingle.mockReturnValueOnce(pending.promise);
    show();
    open();
    await waitFor(() => expect(mocks.authorSingle).toHaveBeenCalledOnce());
    act(() => {
      client.setQueryData(
        favoritesQueryKeys.currentUser(),
        "00000000-0000-0000-0000-00000000a902",
      );
      client.setQueryData(favoritesQueryKeys.sessionRevision(), 1);
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await act(async () =>
      pending.resolve({ data: editorFixture.author, error: null }),
    );
    expect(screen.queryByText("@creator_test")).toBeNull();
    expect(
      screen.getByText(en.Profile.uploads.editor.sessionUnavailable),
    ).not.toBeNull();
    assertReadOnly();
  });
  it("releases the additional local cover URL when preview unmounts", () => {
    const result = show();
    fireEvent.change(
      screen.getByLabelText(en.Profile.uploads.editor.chooseCover),
      {
        target: {
          files: [new File(["png"], "cover.png", { type: "image/png" })],
        },
      },
    );
    open();
    result.unmount();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    assertReadOnly();
  });
  it("shows the unsaved access plan and keeps it local after preview", () => {
    show();
    const select = screen.getByRole("combobox", {
      name: en.Profile.uploads.form.minimumPlan,
    });
    fireEvent.keyDown(select, { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("option", { name: "Pro" }));
    const view = open();
    expect(view.getByText("pro")).not.toBeNull();
    fireEvent.click(view.getByRole("button", { name: t.close }));
    expect(select.textContent).toBe("Pro");
    expect(
      screen.getByRole("button", { name: en.Profile.uploads.editor.save }),
    ).toHaveProperty("disabled", false);
    assertReadOnly();
  });
  it("resets private preview when the same account has a new session revision", async () => {
    show();
    const view = open();
    await waitFor(() => expect(view.getByText("@creator_test")).not.toBeNull());
    act(() => client.setQueryData(favoritesQueryKeys.sessionRevision(), 1));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const reopened = open();
    await waitFor(() =>
      expect(reopened.getByText("@creator_test")).not.toBeNull(),
    );
    expect(mocks.authorSingle).toHaveBeenCalledTimes(2);
    assertReadOnly();
  });
});
