import en from "@/messages/en.json";
import ua from "@/messages/ua.json";
import ModelManagementActions from "@/src/app/[locale]/(main-pages)/profile/uploads/components/ModelManagementActions";
import { LocaleCode } from "@/src/business/constants/localization";
import { modelManagementRpcErrors } from "@/src/business/constants/modelManagement";
import { favoritesQueryKeys } from "@/src/business/queries/favorites";
import type { ModelManagementControlsProps } from "@/src/business/types/modelManagement";
import { mapCategoryGroupRowsToOptions } from "@/src/business/utils/categories";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { Toaster, toast } from "sonner";
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
import {
  type MatchMediaController,
  installMatchMediaMock,
} from "../mocks/match-media";
import {
  deferredModelManagementResponse,
  modelManagementFixture as fixture,
  installModelManagementBrowserApis,
  modelManagementMocks as mocks,
  queueModelCleanup,
  resetModelManagementMocks,
  modelManagementRouter as router,
} from "../mocks/model-management";

vi.mock("@/src/business/utils/supabase/server", async () => {
  const { modelManagementMocks } = await import("../mocks/model-management");
  return { createClient: modelManagementMocks.createClient };
});
vi.mock("@/src/business/utils/supabase/client", async () => {
  const { modelManagementMocks } = await import("../mocks/model-management");
  return {
    createClient: () => ({ auth: { getUser: modelManagementMocks.getUser } }),
  };
});
vi.mock("next/cache", async () => {
  const { modelManagementMocks } = await import("../mocks/model-management");
  return { revalidatePath: modelManagementMocks.revalidatePath };
});
vi.mock("next/navigation", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/navigation")>();
  const { createModelManagementNavigationMock } =
    await import("../mocks/model-management");
  return { ...original, ...createModelManagementNavigationMock() };
});

let client: QueryClient;
let media: MatchMediaController;
let restoreBrowserApis: () => void;
const copy = en.Profile.uploads.management;
beforeEach(() => {
  resetModelManagementMocks();
  media = installMatchMediaMock();
  restoreBrowserApis = installModelManagementBrowserApis();
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
    },
  });
  client.setQueryData(favoritesQueryKeys.currentUser(), fixture.user.id);
  client.setQueryData(favoritesQueryKeys.sessionRevision(), 1);
});
afterEach(() => {
  client.clear();
  toast.dismiss();
  media.cleanup();
  restoreBrowserApis();
  vi.useRealTimers();
});

function renderControls(
  overrides: Partial<ModelManagementControlsProps> = {},
  locale: LocaleCode = LocaleCode.English,
) {
  const props: ModelManagementControlsProps = {
    ownerId: fixture.user.id,
    model: { ...fixture.listRow, status: "published" },
    canUpload: true,
    categoryGroups: mapCategoryGroupRowsToOptions(
      fixture.categoryGroups,
      locale,
    ),
    ...overrides,
  };
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        locale={locale}
        messages={locale === LocaleCode.Ukrainian ? ua : en}
      >
        <ModelManagementActions {...props} />
        <Toaster />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}
async function click(name: string) {
  const button = await screen.findByRole("button", { name });
  await waitFor(() => expect(button).toHaveProperty("disabled", false));
  fireEvent.click(button);
}
async function openEditor() {
  await click(copy.edit);
  const dialog = await screen.findByRole("dialog", { name: copy.editTitle });
  await within(dialog).findByLabelText(en.Profile.uploads.form.titleEn);
  return dialog;
}
async function openDeletion() {
  await click(copy.delete);
  return screen.findByRole("alertdialog", { name: copy.deleteTitle });
}
function queueArchived(pending = false) {
  mocks.readSingle.mockResolvedValue({
    data: { ...fixture.model, status: "archived", deletion_pending: pending },
    error: null,
  });
}

describe("owned model management UI", () => {
  it("loads current editor values, keeps files out of the form and saves only editable metadata", async () => {
    client.setQueryData(["unrelated"], { keep: true });
    client.setQueryData(["catalog", "list"], []);
    renderControls();
    const dialog = await openEditor();
    expect(
      within(dialog).getByLabelText(en.Profile.uploads.form.titleUa),
    ).toHaveProperty("value", fixture.model.title_ua);
    expect(dialog.querySelector('input[type="file"]')).toBeNull();
    fireEvent.change(
      within(dialog).getByLabelText(en.Profile.uploads.form.titleEn),
      { target: { value: "  Updated title  " } },
    );
    fireEvent.change(
      within(dialog).getByLabelText(en.Profile.uploads.form.descriptionEn),
      { target: { value: "   " } },
    );
    fireEvent.click(within(dialog).getByRole("button", { name: copy.save }));
    await screen.findByText(copy.success.update);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("manage_owned_model", {
      requested_model_id: fixture.model.id,
      requested_operation: "update",
      requested_metadata: {
        titleUa: fixture.model.title_ua,
        titleEn: "Updated title",
        descriptionUa: null,
        descriptionEn: null,
        categoryId: fixture.model.category_id,
        minimumPlan: "free",
      },
    });
    expect(router.refresh).toHaveBeenCalledOnce();
    expect(client.getQueryState(["catalog", "list"])?.isInvalidated).toBe(true);
    expect(client.getQueryState(["unrelated"])?.isInvalidated).toBe(false);
  });
  it("validates empty titles before any write and keeps entered values", async () => {
    renderControls();
    const dialog = await openEditor();
    const title = within(dialog).getByLabelText(
      en.Profile.uploads.form.titleEn,
    );
    fireEvent.change(title, { target: { value: " " } });
    fireEvent.click(within(dialog).getByRole("button", { name: copy.save }));
    await within(dialog).findByText(copy.invalidField);
    expect(title.getAttribute("aria-invalid")).toBe("true");
    expect(title).toHaveProperty("value", " ");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("changes the access plan through the real keyboard-accessible select", async () => {
    renderControls();
    const dialog = await openEditor();
    fireEvent.keyDown(
      within(dialog).getByRole("combobox", {
        name: en.Profile.uploads.form.minimumPlan,
      }),
      { key: "ArrowDown" },
    );
    fireEvent.click(await screen.findByRole("option", { name: "Pro" }));
    fireEvent.click(within(dialog).getByRole("button", { name: copy.save }));
    await screen.findByText(copy.success.update);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "manage_owned_model",
      expect.objectContaining({
        requested_metadata: expect.objectContaining({ minimumPlan: "pro" }),
      }),
    );
  });
  it("keeps the form and unsaved input after a server failure", async () => {
    renderControls();
    const dialog = await openEditor();
    mocks.rpcSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "private database error" },
    });
    const title = within(dialog).getByLabelText(
      en.Profile.uploads.form.titleEn,
    );
    fireEvent.change(title, { target: { value: "Unsaved title" } });
    fireEvent.click(within(dialog).getByRole("button", { name: copy.save }));
    await within(dialog).findByRole("alert");
    expect(title).toHaveProperty("value", "Unsaved title");
    expect(within(dialog).getByRole("alert").textContent).toBe(
      copy.errors.generic,
    );
    expect(document.body.textContent).not.toContain("private database error");
  });
  it("lets the editor retry a failed read without a write", async () => {
    mocks.readSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "offline" },
    });
    renderControls();
    await click(copy.edit);
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByRole("alert");
    fireEvent.click(within(dialog).getByRole("button", { name: copy.retry }));
    await within(dialog).findByLabelText(en.Profile.uploads.form.titleEn);
    expect(mocks.readSingle).toHaveBeenCalledTimes(2);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("ignores a late editor read after closing and reopening", async () => {
    const late = deferredModelManagementResponse<{
      data: typeof fixture.model;
      error: null;
    }>();
    mocks.readSingle.mockReturnValueOnce(late.promise);
    renderControls();
    await click(copy.edit);
    await screen.findByText(copy.loading);
    await click(copy.close);
    const dialog = await openEditor();
    await act(async () =>
      late.resolve({
        data: { ...fixture.model, title_en: "Stale title" },
        error: null,
      }),
    );
    expect(
      within(dialog).getByLabelText(en.Profile.uploads.form.titleEn),
    ).toHaveProperty("value", fixture.model.title_en);
  });
  it("archives and then publishes only after authoritative confirmation", async () => {
    queueArchived();
    renderControls();
    await click(copy.archive);
    await screen.findByText(copy.success.archive);
    await screen.findByRole("button", { name: copy.publish });
    mocks.readSingle.mockResolvedValue({ data: fixture.model, error: null });
    await click(copy.publish);
    await screen.findByText(copy.success.publish);
    await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(2));
    expect(
      mocks.rpc.mock.calls.map((call) => call[1]?.requested_operation),
    ).toEqual(["archive", "publish"]);
  });
  it("still permits editing, archiving and deletion after upload permission is revoked", async () => {
    queueArchived();
    renderControls({ canUpload: false });
    expect(screen.getByRole("button", { name: copy.edit })).toHaveProperty(
      "disabled",
      false,
    );
    expect(screen.getByRole("button", { name: copy.delete })).toHaveProperty(
      "disabled",
      false,
    );
    await click(copy.archive);
    expect(
      await screen.findByRole("button", { name: copy.publish }),
    ).toHaveProperty("disabled", true);
    expect(screen.getByText(copy.publishUnavailable)).not.toBeNull();
  });
  it("blocks duplicate writes while a request is pending", async () => {
    const pending = deferredModelManagementResponse<{
      data: typeof fixture.row;
      error: null;
    }>();
    mocks.rpcSingle.mockReturnValueOnce(pending.promise);
    queueArchived();
    renderControls();
    const archive = screen.getByRole("button", { name: copy.archive });
    fireEvent.click(archive);
    fireEvent.click(archive);
    await waitFor(() => expect(mocks.rpcSingle).toHaveBeenCalledOnce());
    expect(archive).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: copy.delete })).toHaveProperty(
      "disabled",
      true,
    );
    await act(async () => pending.resolve({ data: fixture.row, error: null }));
    await screen.findByText(copy.success.archive);
  });
  it("requires explicit confirmation, focuses Cancel and restores trigger focus on cancellation", async () => {
    renderControls();
    const dialog = await openDeletion();
    expect(dialog.textContent).toContain("Model title");
    expect(dialog.textContent).toContain("quota is not refunded");
    expect(document.activeElement).toBe(
      within(dialog).getByRole("button", { name: copy.cancel }),
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: copy.delete }),
      ),
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("deletes the actual scoped files and shows success only after finalization", async () => {
    queueModelCleanup();
    renderControls();
    const dialog = await openDeletion();
    fireEvent.click(
      within(dialog).getByRole("button", { name: copy.confirmDelete }),
    );
    await screen.findByText(copy.success.delete);
    await screen.findByText(copy.deleted);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(mocks.remove).toHaveBeenNthCalledWith(1, fixture.modelPaths);
    expect(mocks.remove).toHaveBeenNthCalledWith(2, fixture.imagePaths);
    expect(
      mocks.rpc.mock.calls.map((call) => call[1]?.requested_operation),
    ).toEqual(["begin_delete", "finish_delete"]);
  });
  it("prevents cancellation and duplicate confirmation during deletion", async () => {
    const pending = deferredModelManagementResponse<{
      data: typeof fixture.row;
      error: null;
    }>();
    mocks.rpcSingle.mockReturnValueOnce(pending.promise);
    renderControls();
    const dialog = await openDeletion();
    const confirm = within(dialog).getByRole("button", {
      name: copy.confirmDelete,
    });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(mocks.rpcSingle).toHaveBeenCalledOnce());
    expect(
      within(dialog).getByRole("button", { name: copy.cancel }),
    ).toHaveProperty("disabled", true);
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.getByRole("alertdialog")).toBe(dialog);
    expect(screen.queryByText(copy.success.delete)).toBeNull();
    await act(async () => pending.resolve({ data: fixture.row, error: null }));
    await screen.findByText(copy.success.delete);
  });
  it("keeps incomplete deletion recoverable and never offers edit or publish for pending models", async () => {
    queueModelCleanup();
    mocks.remove.mockResolvedValueOnce({
      data: null,
      error: { message: "offline" },
    });
    queueArchived(true);
    renderControls();
    const dialog = await openDeletion();
    fireEvent.click(
      within(dialog).getByRole("button", { name: copy.confirmDelete }),
    );
    await within(dialog).findByText(copy.errors.cleanup_incomplete);
    expect(screen.queryByText(copy.success.delete)).toBeNull();
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: copy.continueDelete }),
      ).toHaveProperty("disabled", false),
    );
    fireEvent.click(within(dialog).getByRole("button", { name: copy.cancel }));
    expect(screen.queryByRole("button", { name: copy.edit })).toBeNull();
    expect(screen.queryByRole("button", { name: copy.publish })).toBeNull();
    await click(copy.continueDelete);
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: copy.continueDelete,
      }),
    );
    await screen.findByText(copy.success.delete);
  });
  it("requires a successful reread after an unconfirmed mutation and failed reconciliation", async () => {
    mocks.rpcSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "lost response" },
    });
    mocks.readSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "offline" },
    });
    renderControls();
    await click(copy.archive);
    await screen.findByText(copy.recheckRequired);
    expect(screen.getByRole("button", { name: copy.archive })).toHaveProperty(
      "disabled",
      true,
    );
    await click(copy.recheck);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: copy.archive })).toHaveProperty(
        "disabled",
        false,
      ),
    );
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });
  it.each(modelManagementRpcErrors)(
    "renders safe localized %s action errors",
    async (error) => {
      mocks.rpcSingle.mockResolvedValueOnce({
        data: { ...fixture.row, result: error },
        error: null,
      });
      renderControls();
      await click(copy.archive);
      await waitFor(() =>
        expect(screen.getAllByText(copy.errors[error]).length).toBeGreaterThan(
          0,
        ),
      );
      expect(screen.queryByText(copy.success.archive)).toBeNull();
    },
  );
  it("uses actual Ukrainian messages", async () => {
    renderControls({}, LocaleCode.Ukrainian);
    await click(ua.Profile.uploads.management.archive);
    await screen.findByText(ua.Profile.uploads.management.success.archive);
  });
  it("reports the real action timeout without showing success or replaying the write", async () => {
    renderControls();
    vi.useFakeTimers();
    mocks.rpcSingle.mockReturnValueOnce(new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: copy.archive }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_050);
    });
    expect(screen.getByRole("alert").textContent).toBe(copy.errors.timeout);
    expect(screen.queryByText(copy.success.archive)).toBeNull();
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });
  it("closes private editor contents when the account changes", async () => {
    renderControls();
    await openEditor();
    await act(async () => {
      client.setQueryData(favoritesQueryKeys.currentUser(), null);
      client.setQueryData(favoritesQueryKeys.sessionRevision(), 2);
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByLabelText(en.Profile.uploads.form.titleEn)).toBeNull();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("removes open private UI and ignores results after switching to another account", async () => {
    const pending = deferredModelManagementResponse<{
      data: typeof fixture.row;
      error: null;
    }>();
    mocks.rpcSingle.mockReturnValueOnce(pending.promise);
    renderControls();
    const dialog = await openDeletion();
    fireEvent.click(
      within(dialog).getByRole("button", { name: copy.confirmDelete }),
    );
    await waitFor(() => expect(mocks.rpcSingle).toHaveBeenCalledOnce());
    await act(async () => {
      client.setQueryData(favoritesQueryKeys.currentUser(), fixture.model.id);
      client.setQueryData(favoritesQueryKeys.sessionRevision(), 2);
    });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    await act(async () => pending.resolve({ data: fixture.row, error: null }));
    expect(screen.queryByText(copy.success.delete)).toBeNull();
    expect(router.refresh).not.toHaveBeenCalled();
  });
  it("does not reuse a previous session's deletion state after switching away and back", async () => {
    renderControls();
    const dialog = await openDeletion();
    fireEvent.click(
      within(dialog).getByRole("button", { name: copy.confirmDelete }),
    );
    await screen.findByText(copy.deleted);
    await act(async () => {
      client.setQueryData(favoritesQueryKeys.currentUser(), null);
      client.setQueryData(favoritesQueryKeys.sessionRevision(), 2);
    });
    await act(async () => {
      client.setQueryData(favoritesQueryKeys.currentUser(), fixture.user.id);
      client.setQueryData(favoritesQueryKeys.sessionRevision(), 3);
    });
    await waitFor(() => expect(screen.queryByText(copy.deleted)).toBeNull());
    expect(screen.getByRole("button", { name: copy.edit })).toHaveProperty(
      "disabled",
      false,
    );
  });
  it("keeps archive and delete available when only categories are unavailable", () => {
    renderControls({ categoryGroups: null });
    expect(screen.getByRole("button", { name: copy.edit })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: copy.archive })).toHaveProperty(
      "disabled",
      false,
    );
    expect(screen.getByRole("button", { name: copy.delete })).toHaveProperty(
      "disabled",
      false,
    );
  });
});
