import en from "@/messages/en.json";
import ua from "@/messages/ua.json";
import PublicationEditor from "@/src/app/[locale]/(main-pages)/profile/uploads/components/PublicationEditor";
import { PUBLICATION_EDITOR_REQUEST_TIMEOUT_MS } from "@/src/business/constants/modelPublicationEditor";
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
import {
  publicationDeferred,
  publicationFixture,
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

let client: QueryClient;
let cleanupBrowser: () => void;
let cleanupMedia: () => void;
const messages = en.Profile.uploads.editor;
beforeEach(() => {
  resetEditorMocks();
  cleanupBrowser = installEditorBrowserApis();
  cleanupMedia = installMatchMediaMock().cleanup;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55321");
  vi.spyOn(crypto, "randomUUID").mockReturnValue(
    "00000000-0000-0000-0000-00000000f201",
  );
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
  vi.useRealTimers();
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
const save = () =>
  fireEvent.click(screen.getByRole("button", { name: messages.save }));
const changeTitle = (value: string) =>
  fireEvent.change(screen.getByLabelText(en.Profile.uploads.form.titleEn), {
    target: { value },
  });
const operations = () =>
  mocks.rpc.mock.calls.map((call) => call[1].requested_operation);
const readiness = () =>
  screen.getByRole("complementary", { name: messages.readiness.title });
function expectReadiness(complete: number) {
  const progress = within(readiness()).getByRole("progressbar", {
    name: messages.readiness.title,
  });
  expect(progress).toHaveProperty("value", complete);
  expect(progress).toHaveProperty("max", 5);
  expect(
    within(readiness()).getByText(`${complete} of 5 required items ready`),
  ).not.toBeNull();
}
function publishedInitial(
  cleanupPending: boolean,
): NonNullable<PublicationEditorProps["initial"]> {
  const data = editorInitialData();
  const draft = {
    ...data.draft,
    lifecycle: "published" as const,
    publication_model_id: publicationFixture.modelId,
  };
  setEditorDraft(
    { ...draft, source_asset_id: null, cover_asset_id: null },
    cleanupPending
      ? [editorFixture.source, editorFixture.cover].map((asset) => ({
          ...asset,
          state: "retired" as const,
        }))
      : [],
  );
  return {
    draft,
    source: null,
    cover: null,
    coverUrl: null,
    cleanupPending,
  };
}

describe("manual publication editor", () => {
  it.each(["en", "ua"] as const)(
    "renders the actual editor in %s without writing on mount",
    (locale) => {
      show({}, locale);
      const t = (locale === "ua" ? ua : en).Profile.uploads.editor;
      expect(
        screen.getByRole("heading", { level: 1, name: t.editTitle }),
      ).not.toBeNull();
      expect(screen.getByRole("button", { name: t.save })).toHaveProperty(
        "disabled",
        true,
      );
      expect(screen.getByRole("button", { name: t.publish })).toHaveProperty(
        "disabled",
        false,
      );
      expect(screen.queryByText("object_path")).toBeNull();
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it("shows required progress as the user fills titles, category and files without saving", async () => {
    resetEditorMocks(true);
    show({ initial: null });
    expectReadiness(0);
    expect(
      within(readiness()).getAllByText(messages.readiness.missing),
    ).toHaveLength(5);

    changeTitle("New sofa");
    expectReadiness(1);
    fireEvent.click(screen.getByRole("tab", { name: "Українська" }));
    fireEvent.change(screen.getByLabelText(en.Profile.uploads.form.titleUa), {
      target: { value: "Новий диван" },
    });
    expectReadiness(2);

    const category = screen.getByRole("combobox", {
      name: en.Profile.uploads.form.category,
    });
    fireEvent.click(
      screen.getByRole("button", { name: messages.categoryTrigger }),
    );
    act(() => category.focus());
    fireEvent.change(category, { target: { value: "chair" } });
    fireEvent.click(await screen.findByRole("option", { name: "Chairs" }));
    expectReadiness(3);

    fireEvent.change(screen.getByLabelText(messages.chooseSource), {
      target: { files: [new File(["model"], "sofa.obj")] },
    });
    expectReadiness(4);
    fireEvent.change(screen.getByLabelText(messages.chooseCover), {
      target: {
        files: [new File(["image"], "sofa.png", { type: "image/png" })],
      },
    });
    expectReadiness(5);
    expect(
      screen.getByRole("button", { name: messages.publish }),
    ).toHaveProperty("disabled", false);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: messages.undoCover }));
    expectReadiness(4);
    expect(
      screen.getByRole("button", { name: messages.publish }),
    ).toHaveProperty("disabled", true);
  });
  it("searches categories by their group, handles no results and clears the selected category", async () => {
    show({
      categoryGroups: [
        ...editorFixture.categories,
        {
          id: "00000000-0000-0000-0000-00000000a912",
          value: "lighting",
          label: "Lighting",
          categories: [
            {
              id: "00000000-0000-0000-0000-00000000c912",
              value: "pendant-lamps",
              label: "Pendant lamps",
            },
          ],
        },
      ],
    });
    const category = screen.getByRole("combobox", {
      name: en.Profile.uploads.form.category,
    });
    expect(category).toHaveProperty("value", "Chairs");

    fireEvent.click(
      screen.getByRole("button", { name: messages.categoryTrigger }),
    );
    act(() => category.focus());
    fireEvent.change(category, { target: { value: "LIGHTING" } });
    const option = await screen.findByRole("option", { name: "Pendant lamps" });
    expect(within(option).getByText("Lighting")).not.toBeNull();
    expect(screen.queryByRole("option", { name: "Chairs" })).toBeNull();
    fireEvent.click(option);
    expect(category).toHaveProperty("value", "Pendant lamps");
    expectReadiness(5);

    fireEvent.click(
      screen.getByRole("button", { name: messages.categoryTrigger }),
    );
    act(() => category.focus());
    fireEvent.change(category, { target: { value: "no matching category" } });
    await screen.findByText(en.Profile.uploads.form.categoryEmpty);
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    fireEvent.keyDown(category, { key: "Escape" });
    fireEvent.click(
      await screen.findByRole("button", { name: messages.clearCategory }),
    );
    expect(category).toHaveProperty("value", "");
    expectReadiness(4);
    expect(
      screen.getByRole("button", { name: messages.publish }),
    ).toHaveProperty("disabled", true);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("searches current input when an empty popup is immediately reopened", async () => {
    resetEditorMocks(true);
    show({ initial: null });
    const category = screen.getByRole("combobox", {
      name: en.Profile.uploads.form.category,
    });
    fireEvent.click(
      screen.getByRole("button", { name: messages.categoryTrigger }),
    );
    act(() => category.focus());
    fireEvent.change(category, { target: { value: "no-matching-category" } });
    await screen.findByText(en.Profile.uploads.form.categoryEmpty);
    fireEvent.keyDown(category, { key: "Escape" });
    fireEvent.keyDown(category, { key: "ArrowDown" });
    fireEvent.change(category, {
      target: { value: editorFixture.categories[0].label.toUpperCase() },
    });
    expect(
      await screen.findByRole("option", { name: "Chairs" }),
    ).not.toBeNull();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("allows optional empty descriptions but flags invalid optional content before publication", () => {
    show();
    const description = screen.getByLabelText(
      en.Profile.uploads.form.descriptionEn,
    );
    expect(description).toHaveProperty("value", "");
    expect(screen.getAllByText(messages.optional)).toHaveLength(2);
    expectReadiness(5);
    expect(
      screen.getByRole("button", { name: messages.publish }),
    ).toHaveProperty("disabled", false);

    fireEvent.change(description, { target: { value: "x".repeat(601) } });
    expectReadiness(5);
    expect(within(readiness()).getByRole("alert").textContent).toBe(
      messages.readiness.invalidMetadata,
    );
    expect(
      screen.getByRole("button", { name: messages.publish }),
    ).toHaveProperty("disabled", true);
    expect(mocks.rpc).not.toHaveBeenCalled();

    fireEvent.change(description, { target: { value: "" } });
    expect(within(readiness()).queryByRole("alert")).toBeNull();
    expect(
      screen.getByRole("button", { name: messages.publish }),
    ).toHaveProperty("disabled", false);
  });
  it("keeps typing local, supports undoing text edits and saves only on explicit click", async () => {
    show();
    changeTitle("Edited sofa");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: messages.save })).toHaveProperty(
      "disabled",
      false,
    );
    changeTitle("Sofa");
    expect(screen.getByRole("button", { name: messages.save })).toHaveProperty(
      "disabled",
      true,
    );
    changeTitle("Edited sofa");
    save();
    await screen.findByText(messages.notices.saved);
    expect(operations()).toEqual(["save"]);
    expect(mocks.rpc.mock.calls[0][1]).toMatchObject({
      requested_revision: 0,
      requested_payload: { titleEn: "Edited sofa" },
    });
    expect(screen.getByRole("button", { name: messages.save })).toHaveProperty(
      "disabled",
      true,
    );
  });
  it("creates a new incomplete draft only after saving and opens its stable route", async () => {
    resetEditorMocks(true);
    show({ initial: null });
    expect(mocks.rpc).not.toHaveBeenCalled();
    changeTitle("A");
    save();
    await screen.findByText(messages.notices.saved);
    expect(operations()).toEqual(["create", "save"]);
    expect(router.replace).toHaveBeenCalledWith(
      `/en/profile/uploads/${editorFixture.draftId}`,
      { scroll: false },
    );
    expect(
      screen.getByRole("button", { name: messages.publish }),
    ).toHaveProperty("disabled", true);
  });
  it("keeps selected files local until Save and uploads directly through authenticated Storage", async () => {
    show();
    const file = new File(["replacement"], "replacement.obj", {
      type: "text/plain",
    });
    fireEvent.change(screen.getByLabelText(messages.chooseSource), {
      target: { files: [file] },
    });
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(screen.getByText(file.name)).not.toBeNull();
    save();
    await screen.findByText(messages.notices.saved);
    expect(operations()).toEqual([
      "reserve",
      "attach",
      "cleanup",
      "finish_cleanup",
    ]);
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringContaining(editorFixture.draftId),
      file,
      expect.objectContaining({
        upsert: false,
        contentType: "application/octet-stream",
      }),
    );
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("rejects unsupported files before any upload and can undo a valid local selection", () => {
    show();
    fireEvent.change(screen.getByLabelText(messages.chooseCover), {
      target: {
        files: [new File(["x"], "bad.svg", { type: "image/svg+xml" })],
      },
    });
    expect(screen.getByRole("alert").textContent).toBe(
      messages.errors.invalid_request,
    );
    fireEvent.change(screen.getByLabelText(messages.chooseCover), {
      target: {
        files: [new File(["png"], "cover.png", { type: "image/png" })],
      },
    });
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: messages.undoCover }));
    expect(screen.getByRole("button", { name: messages.save })).toHaveProperty(
      "disabled",
      true,
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("retains confirmed text, old active source and the pending file after transfer failure, then retries", async () => {
    show();
    changeTitle("Saved text");
    const file = new File(["new"], "replacement.obj");
    fireEvent.change(screen.getByLabelText(messages.chooseSource), {
      target: { files: [file] },
    });
    mocks.upload.mockResolvedValueOnce({
      data: null,
      error: { message: "offline" },
    });
    save();
    await screen.findByText(messages.errors.storage_unavailable);
    expect(
      screen.getByLabelText(en.Profile.uploads.form.titleEn),
    ).toHaveProperty("value", "Saved text");
    expect(screen.getByText(file.name)).not.toBeNull();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(operations()).toEqual(["save", "reserve"]);
    save();
    await screen.findByText(messages.notices.saved);
    expect(operations().filter((value) => value === "save")).toHaveLength(1);
    expect(mocks.upload).toHaveBeenCalledTimes(2);
  });
  it("does not overwrite a conflicting version or discard local edits without confirmation", async () => {
    show();
    changeTitle("Local edit");
    setEditorDraft({ title_en: "Other device", revision: 1 });
    mocks.rpcSingle.mockResolvedValueOnce({
      data: publicationRow({ result: "conflict" }),
      error: null,
    });
    save();
    await screen.findByText(messages.errors.conflict);
    expect(
      screen.getByLabelText(en.Profile.uploads.form.titleEn),
    ).toHaveProperty("value", "Local edit");
    expect(screen.getByRole("button", { name: messages.save })).toHaveProperty(
      "disabled",
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: messages.loadSaved }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByRole("button", { name: messages.stay })).toBe(
      document.activeElement,
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: messages.confirmAction }),
    );
    await waitFor(() =>
      expect(
        screen.getByLabelText(en.Profile.uploads.form.titleEn),
      ).toHaveProperty("value", "Other device"),
    );
    expect(operations()).toHaveLength(1);
  });
  it("publishes a complete unchanged draft without another save or model", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: messages.publish }));
    await screen.findByRole("heading", { name: messages.publishedTitle });
    expect(operations()).toEqual([
      "prepare_publish",
      "finish_publish",
      "cleanup",
      "finish_cleanup",
    ]);
    expect(mocks.copy).toHaveBeenCalledTimes(2);
    expect(router.refresh).toHaveBeenCalled();
  });
  it.each(["en", "ua"] as const)(
    "shows a clean published result after reload in %s",
    (locale) => {
      show({ initial: publishedInitial(false) }, locale);
      const t = (locale === "ua" ? ua : en).Profile.uploads.editor;
      expect(
        screen.getByRole("heading", { level: 1, name: t.publishedTitle }),
      ).not.toBeNull();
      expect(
        screen
          .getByRole("link", { name: t.createAnother })
          .getAttribute("href"),
      ).toBe(`/${locale}/profile/uploads/new`);
      expect(screen.queryByText(t.manualSave)).toBeNull();
      expect(screen.queryByText(t.savedState)).toBeNull();
      expect(screen.queryByRole("button", { name: t.retryCleanup })).toBeNull();
      expect(screen.queryByRole("progressbar")).toBeNull();
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it("retains published success and cleanup retry across a failed attempt, then confirms completion", async () => {
    show({ initial: publishedInitial(true) });
    expect(
      screen.getByRole("heading", { name: messages.publishedTitle }),
    ).not.toBeNull();
    mocks.remove.mockResolvedValueOnce({
      data: null,
      error: { statusCode: "500" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: messages.retryCleanup }),
    );
    await screen.findByText(messages.errors.cleanup_incomplete);
    expect(
      screen.getByRole("heading", { name: messages.publishedTitle }),
    ).not.toBeNull();
    expect(screen.queryByText(messages.manualSave)).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: messages.retryCleanup }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: messages.retryCleanup }),
      ).toBeNull(),
    );
    expect(screen.queryByText(messages.savedState)).toBeNull();
    expect(mocks.assetCountResult).toHaveBeenCalled();
  });
  it("does not hide pending cleanup until a delayed server-state read confirms it", async () => {
    show({ initial: publishedInitial(true) });
    const count = publicationDeferred<{
      data: null;
      count: number;
      error: null;
    }>();
    mocks.assetCountResult.mockReturnValueOnce(count.promise);
    fireEvent.click(
      screen.getByRole("button", { name: messages.retryCleanup }),
    );
    await waitFor(() =>
      expect(mocks.assetCountResult).toHaveBeenCalledTimes(1),
    );
    expect(
      screen.getByRole("button", { name: messages.retryCleanup }),
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("heading", { name: messages.publishedTitle }),
    ).not.toBeNull();
    await act(async () => count.resolve({ data: null, count: 0, error: null }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: messages.retryCleanup }),
      ).toBeNull(),
    );
  });
  it("keeps retry when the cleanup RPC succeeds but the server still reports temporary records", async () => {
    show({ initial: publishedInitial(true) });
    mocks.assetCountResult.mockResolvedValue({
      data: null,
      count: 1,
      error: null,
    });
    fireEvent.click(
      screen.getByRole("button", { name: messages.retryCleanup }),
    );
    await screen.findByText(messages.errors.cleanup_incomplete);
    expect(
      screen.getByRole("heading", { name: messages.publishedTitle }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: messages.retryCleanup }),
    ).toHaveProperty("disabled", false);
    mocks.assetCountResult.mockResolvedValue({
      data: null,
      count: 0,
      error: null,
    });
    fireEvent.click(
      screen.getByRole("button", { name: messages.retryCleanup }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: messages.retryCleanup }),
      ).toBeNull(),
    );
  });
  it("rereads a failed copy and retries the same frozen publication", async () => {
    show();
    mocks.copy.mockResolvedValueOnce({
      data: null,
      error: { statusCode: "500" },
    });
    fireEvent.click(screen.getByRole("button", { name: messages.publish }));
    await screen.findByText(messages.errors.storage_unavailable);
    expect(
      screen.getByRole("button", { name: messages.retryPublish }),
    ).toHaveProperty("disabled", false);
    fireEvent.click(
      screen.getByRole("button", { name: messages.retryPublish }),
    );
    await screen.findByRole("heading", { name: messages.publishedTitle });
    expect(operations().filter((value) => value === "create")).toHaveLength(0);
  });
  it("requires confirmation to delete and returns to My models only after confirmed cleanup", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: messages.delete }));
    expect(mocks.rpc).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: messages.confirmAction,
      }),
    );
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/en/profile/uploads"),
    );
    expect(operations()).toEqual(["begin_delete", "cleanup", "finish_cleanup"]);
  });
  it("allows saved metadata after revocation but blocks file transfer and publication", async () => {
    show({ canUpload: false });
    expect(
      screen.getByRole("button", { name: messages.publish }),
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("button", { name: messages.replaceSource }),
    ).toHaveProperty("disabled", true);
    changeTitle("Text only");
    save();
    await screen.findByText(messages.notices.saved);
    expect(operations()).toEqual(["save"]);
  });
  it("retains draft saving when category reads fail, without enabling publication", async () => {
    show({ categoryGroups: null });
    changeTitle("Text only");
    expect(
      screen.getByRole("button", { name: messages.publish }),
    ).toHaveProperty("disabled", true);
    save();
    await screen.findByText(messages.notices.saved);
  });
  it("blocks duplicate saves while a request is pending and ignores another session's late result", async () => {
    show();
    changeTitle("Local edit");
    const late = publicationDeferred<{
      data: ReturnType<typeof publicationRow>;
      error: null;
    }>();
    mocks.rpcSingle.mockReturnValueOnce(late.promise);
    save();
    save();
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledTimes(1));
    await act(async () => {
      client.setQueryData(favoritesQueryKeys.currentUser(), null);
      client.setQueryData(favoritesQueryKeys.sessionRevision(), 1);
    });
    await waitFor(() =>
      expect(
        screen.queryByLabelText(en.Profile.uploads.form.titleEn),
      ).toBeNull(),
    );
    await act(async () =>
      late.resolve({ data: publicationRow({ revision: 1 }), error: null }),
    );
    expect(mocks.readSingle).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });
  it("bounds an unresponsive client transport and requires a saved-state recheck", async () => {
    show();
    changeTitle("Keep this");
    vi.useFakeTimers();
    mocks.rpcSingle.mockReturnValueOnce(new Promise(() => {}));
    save();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(
        PUBLICATION_EDITOR_REQUEST_TIMEOUT_MS + 1,
      );
    });
    vi.useRealTimers();
    await screen.findByText(messages.errors.timeout);
    expect(
      screen.getByLabelText(en.Profile.uploads.form.titleEn),
    ).toHaveProperty("value", "Keep this");
    expect(mocks.readSingle).toHaveBeenCalled();
  });
  it("warns on reload and the editor's Back link only when changes are unsaved", async () => {
    show();
    changeTitle("Local edit");
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole("link", { name: messages.back }));
    expect((await screen.findByRole("alertdialog")).textContent).toContain(
      messages.confirm.leave.title,
    );
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: messages.stay,
      }),
    );
    expect(
      screen.getByLabelText(en.Profile.uploads.form.titleEn),
    ).toHaveProperty("value", "Local edit");
  });
  it("accepts the requested destination once without saving local edits", async () => {
    show();
    changeTitle("Discard this edit");
    fireEvent.click(screen.getByRole("link", { name: messages.back }));
    const dialog = await screen.findByRole("alertdialog");
    expect(router.push).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole("button", { name: messages.confirmAction }),
    );
    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    expect(router.push).toHaveBeenCalledWith(
      expect.stringMatching(/\/en\/profile\/uploads$/),
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("warns for a file-only edit and restores clean navigation after undo", async () => {
    show();
    fireEvent.change(screen.getByLabelText(messages.chooseSource), {
      target: { files: [new File(["new"], "replacement.obj")] },
    });
    fireEvent.click(screen.getByRole("link", { name: messages.back }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: messages.stay }),
    );
    expect(screen.getByText("replacement.obj")).not.toBeNull();
    expect(router.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: messages.undoSource }));
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
  });
  it("allows navigation without a dialog after a confirmed save", async () => {
    show();
    changeTitle("Saved edit");
    save();
    await screen.findByText(messages.notices.saved);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: messages.save }),
      ).toHaveProperty("disabled", true),
    );
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
  it("can stay during a pending save and prevents confirming a premature exit", async () => {
    show();
    changeTitle("Pending edit");
    const finishSave = mocks.rpcSingle.getMockImplementation();
    const late = publicationDeferred<{
      data: ReturnType<typeof publicationRow>;
      error: null;
    }>();
    mocks.rpcSingle.mockReturnValueOnce(late.promise);
    save();
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("link", { name: messages.back }));
    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByRole("button", { name: messages.confirmAction }),
    ).toHaveProperty("disabled", true);
    fireEvent.click(
      within(dialog).getByRole("button", { name: messages.stay }),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
    expect(finishSave).toBeDefined();
    if (!finishSave) throw new Error("Missing save boundary fixture");
    await act(async () => late.resolve(await finishSave()));
    await screen.findByText(messages.notices.saved);
  });
  it("reuses a single create ID after a failed request and a confirmed missing draft", async () => {
    resetEditorMocks(true);
    show({ initial: null });
    changeTitle("Keep this draft");
    mocks.rpcSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "offline" },
    });
    mocks.readSingle.mockResolvedValueOnce({ data: null, error: null });
    save();
    await screen.findByText(messages.errors.generic);
    expect(screen.getByRole("button", { name: messages.save })).toHaveProperty(
      "disabled",
      false,
    );
    save();
    await screen.findByText(messages.notices.saved);
    const creates = mocks.rpc.mock.calls.filter(
      (call) => call[1].requested_operation === "create",
    );
    expect(creates).toHaveLength(2);
    expect(creates[0][1].requested_draft_id).toBe(
      creates[1][1].requested_draft_id,
    );
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });
  it("blocks another write when both mutation and reconciliation are unconfirmed", async () => {
    show();
    changeTitle("Do not erase");
    mocks.rpcSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "offline" },
    });
    mocks.readSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "offline" },
    });
    save();
    await screen.findByText(messages.reviewRequired);
    expect(
      screen.getByLabelText(en.Profile.uploads.form.titleEn),
    ).toHaveProperty("value", "Do not erase");
    expect(screen.getByRole("button", { name: messages.save })).toHaveProperty(
      "disabled",
      true,
    );
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it("can renew a failed private-cover link without saving or discarding text", async () => {
    show();
    changeTitle("Local title");
    mocks.createSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: editorInitialData().coverUrl + "&renewed=1" },
      error: null,
    });
    fireEvent.error(screen.getByRole("img", { name: "Local title" }));
    fireEvent.click(
      screen.getByRole("button", { name: messages.refreshCover }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("img", { name: "Local title" }).getAttribute("src"),
      ).toContain("renewed=1"),
    );
    expect(
      screen.getByLabelText(en.Profile.uploads.form.titleEn),
    ).toHaveProperty("value", "Local title");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("cancels a frozen publication with confirmation and retains private originals", async () => {
    const initial = editorInitialData();
    initial.draft.lifecycle = "publishing";
    initial.draft.publication_model_id = "00000000-0000-0000-0000-00000000f301";
    setEditorDraft({
      lifecycle: "publishing",
      publication_model_id: initial.draft.publication_model_id,
    });
    show({ initial });
    fireEvent.click(
      screen.getByRole("button", { name: messages.cancelPublish }),
    );
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: messages.confirmAction,
      }),
    );
    await screen.findByText(messages.notices.cancelled);
    expect(screen.getByText(editorFixture.source.name)).not.toBeNull();
    expect(
      screen.getByRole("button", { name: messages.publish }),
    ).toHaveProperty("disabled", false);
    expect(operations()).toEqual([
      "cancel_publish",
      "cleanup",
      "finish_cleanup",
    ]);
  });
  it("offers standalone cleanup retry after files were attached but removal failed", async () => {
    show();
    const original = mocks.rpcSingle.getMockImplementation();
    if (!original) throw new Error("Missing fixture response");
    mocks.rpcSingle.mockImplementation(async () => {
      const result = await original();
      if (operations().at(-1) === "cleanup")
        result.data.objects = [
          {
            bucket: "model-draft-files",
            path: `${editorFixture.user.id}/${editorFixture.draftId}/00000000-0000-0000-0000-00000000f499.obj`,
          },
        ];
      return result;
    });
    mocks.remove.mockResolvedValueOnce({
      data: null,
      error: { statusCode: "500" },
    });
    fireEvent.change(screen.getByLabelText(messages.chooseSource), {
      target: { files: [new File(["new"], "replacement.obj")] },
    });
    save();
    await screen.findByText(messages.errors.cleanup_incomplete);
    expect(screen.getByRole("button", { name: messages.save })).toHaveProperty(
      "disabled",
      true,
    );
    fireEvent.click(
      screen.getByRole("button", { name: messages.retryCleanup }),
    );
    await screen.findByText(messages.notices.cleaned);
    expect(operations().filter((value) => value === "attach")).toHaveLength(1);
  });
  it("releases the local preview URL when the editor unmounts", () => {
    const view = show();
    fireEvent.change(screen.getByLabelText(messages.chooseCover), {
      target: {
        files: [new File(["png"], "cover.png", { type: "image/png" })],
      },
    });
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      "blob:http://localhost/selected-cover",
    );
  });
});
