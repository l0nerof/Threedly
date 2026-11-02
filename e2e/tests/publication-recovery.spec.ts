import { expect, test } from "../fixtures";
import {
  localMutationTestsEnabled,
  publicationFixture,
} from "../fixtures/model-publication";
import { recoveryFixture } from "../fixtures/publication-recovery";
import { PublicationRecoveryPage } from "../pages/publication-recovery.page";

test.describe("publication recovery — isolated local accounts", () => {
  test.skip(
    !localMutationTestsEnabled,
    "Enable only with the local Supabase stack",
  );
  test.setTimeout(90_000);

  test.beforeEach(async ({ localMarketplace, marketplaceAccessPage }) => {
    await marketplaceAccessPage.login(localMarketplace.owner);
  });

  test("failed initial source transfer preserves selected files and reuses the created draft on retry", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    publicationNetwork,
    page,
  }) => {
    await editor.open();
    await editor.fillContent();
    await editor.chooseFiles();
    await publicationNetwork.blockSourceUploads();
    const failed = page.waitForEvent("requestfailed", {
      predicate: (request) =>
        request.url().includes("/storage/v1/object/model-draft-files/"),
    });
    await editor.saveButton.click();
    expect((await failed).failure()?.errorText).toMatch(
      /^(inspector|net::ERR_BLOCKED_BY_CLIENT|net::ERR_FAILED)$/,
    );
    await editor.expectFailure(recoveryFixture.storageError);
    await editor.expectSavedTitle();
    await expect(
      page.getByText(`${publicationFixture.cover.name} · ще не збережено`, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Скасувати зміну файлу", exact: true }),
    ).toBeEnabled();
    const drafts = await localMarketplace.ownedDraftStates();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].title_ua).toBe(publicationFixture.titleUa);
    expect(drafts[0].source_asset_id).toBeNull();
    expect(drafts[0].cover_asset_id).toBeNull();
    await publicationNetwork.restore();
    await editor.saveConfirmedDraft();
    const saved = await localMarketplace.ownedDraftStates();
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe(drafts[0].id);
    const assets = await localMarketplace.ownedDraftAssets(saved[0].id);
    expect(assets).toHaveLength(2);
    for (const asset of assets) {
      const read = await localMarketplace.readPrivateAsset(
        localMarketplace.owner.id,
        asset,
      );
      expect(read.error).toBeNull();
      if (!read.data) throw new Error("Retried upload has no bytes");
      expect(Buffer.from(await read.data.arrayBuffer())).toEqual(
        asset.kind === "source"
          ? publicationFixture.source.buffer
          : publicationFixture.cover.buffer,
      );
    }
  });

  test("failed replacement retains active bytes and confirmed metadata until retry succeeds", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    publicationNetwork,
    page,
  }) => {
    const path = await editor.startDraft(true);
    const id = path.split("/").at(-1) ?? "";
    const original = await localMarketplace.ownedDraftAssets(id);
    await editor.titleUa.fill(recoveryFixture.localTitle);
    await editor.sourceInput.setInputFiles(recoveryFixture.replacement);
    await publicationNetwork.blockSourceUploads();
    await editor.saveButton.click();
    await editor.expectFailure(recoveryFixture.storageError);
    await expect(editor.titleUa).toHaveValue(recoveryFixture.localTitle);
    expect((await localMarketplace.ownedDraftState(id)).title_ua).toBe(
      recoveryFixture.localTitle,
    );
    expect(await localMarketplace.ownedDraftAssets(id)).toEqual(original);
    for (const asset of original) {
      const read = await localMarketplace.readPrivateAsset(
        localMarketplace.owner.id,
        asset,
      );
      expect(read.error).toBeNull();
      if (!read.data) throw new Error("Original active bytes were lost");
      expect(Buffer.from(await read.data.arrayBuffer())).toEqual(
        asset.kind === "source"
          ? publicationFixture.source.buffer
          : publicationFixture.cover.buffer,
      );
    }
    await expect(
      page.getByRole("button", { name: "Скасувати зміну файлу", exact: true }),
    ).toBeEnabled();
    await publicationNetwork.restore();
    await editor.saveConfirmedDraft();
    const current = await localMarketplace.ownedDraftAssets(id);
    const source = current.find((asset) => asset.kind === "source");
    if (!source) throw new Error("Replacement source is missing");
    const read = await localMarketplace.readPrivateAsset(
      localMarketplace.owner.id,
      source,
    );
    expect(read.error).toBeNull();
    if (!read.data) throw new Error("Replacement bytes are missing");
    expect(Buffer.from(await read.data.arrayBuffer())).toEqual(
      recoveryFixture.replacement.buffer,
    );
    expect(current.find((asset) => asset.kind === "cover")).toEqual(
      original.find((asset) => asset.kind === "cover"),
    );
    await page.reload();
    await expect(editor.titleUa).toHaveValue(recoveryFixture.localTitle);
    await expect(
      page.getByText(recoveryFixture.replacement.name, { exact: true }),
    ).toBeVisible();
  });

  test("two tabs retry one genuinely prepared publication without creating duplicate models", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    page,
  }) => {
    const path = await editor.startDraft(true, true);
    const id = path.split("/").at(-1) ?? "";
    const prepared = await localMarketplace.preparePublication(id);
    expect(await localMarketplace.publishedModelCount()).toBe(0);
    const other = await page.context().newPage();
    try {
      await page.reload();
      await other.goto(path);
      const retry = page.getByRole("button", {
        name: "Повторити публікацію",
        exact: true,
      });
      const otherRetry = other.getByRole("button", {
        name: "Повторити публікацію",
        exact: true,
      });
      await expect(retry).toBeEnabled();
      await expect(otherRetry).toBeEnabled();
      await Promise.all([retry.click(), otherRetry.click()]);
      await expect(
        page.getByRole("heading", { name: "Модель опублікована", exact: true }),
      ).toBeVisible({ timeout: 20_000 });
      await expect(
        other.getByRole("heading", {
          name: "Модель опублікована",
          exact: true,
        }),
      ).toBeVisible({ timeout: 20_000 });
      const state = await localMarketplace.ownedDraftState(id);
      expect(state.lifecycle).toBe("published");
      expect(state.publication_model_id).toBe(prepared.model_id);
      const models = await localMarketplace.publishedModels();
      expect(models).toHaveLength(1);
      expect(models[0].id).toBe(prepared.model_id);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Модель опублікована", exact: true }),
      ).toBeVisible();
      expect(await localMarketplace.publishedModelCount()).toBe(1);
    } finally {
      await other.close();
    }
  });

  test("a stale tab preserves local text and asks before replacing it with the saved version", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    page,
  }, testInfo) => {
    const path = await editor.startDraft();
    const id = path.split("/").at(-1) ?? "";
    const other = await page.context().newPage();
    try {
      await other.goto(path);
      const stale = new PublicationRecoveryPage(other);
      await expect(stale.titleUa).toBeEnabled();
      await stale.titleUa.fill(recoveryFixture.localTitle);
      await editor.titleUa.fill(recoveryFixture.remoteTitle);
      await editor.saveConfirmedDraft();
      await stale.saveButton.click();
      await stale.expectFailure(recoveryFixture.conflictError);
      await expect(stale.titleUa).toHaveValue(recoveryFixture.localTitle);
      await expect(stale.saveButton).toBeDisabled();
      expect((await localMarketplace.ownedDraftState(id)).title_ua).toBe(
        recoveryFixture.remoteTitle,
      );
      await other.screenshot({
        path: testInfo.outputPath("revision-conflict.png"),
        animations: "disabled",
      });
      const cancelled = await stale.openSavedVersionConfirmation();
      await cancelled
        .getByRole("button", { name: "Залишитися", exact: true })
        .click();
      await expect(stale.titleUa).toHaveValue(recoveryFixture.localTitle);
      const confirmed = await stale.openSavedVersionConfirmation();
      await confirmed
        .getByRole("button", { name: "Продовжити", exact: true })
        .click();
      await expect(stale.titleUa).toHaveValue(recoveryFixture.remoteTitle);
      await stale.titleUa.fill(recoveryFixture.recoveredTitle);
      await stale.saveConfirmedDraft();
      expect((await localMarketplace.ownedDraftState(id)).title_ua).toBe(
        recoveryFixture.recoveredTitle,
      );
    } finally {
      await other.close();
    }
  });

  test("the editor Back dialog preserves changes on cancel and discards only after confirmation", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    page,
  }) => {
    const path = await editor.startDraft();
    const id = path.split("/").at(-1) ?? "";
    await editor.titleUa.fill(recoveryFixture.localTitle);
    const cancelled = await editor.backConfirmation();
    await cancelled
      .getByRole("button", { name: "Залишитися", exact: true })
      .click();
    await expect(editor.titleUa).toHaveValue(recoveryFixture.localTitle);
    const confirmed = await editor.backConfirmation();
    await confirmed
      .getByRole("button", { name: "Продовжити", exact: true })
      .click();
    await expect(page).toHaveURL(/\/ua\/profile\/uploads$/);
    expect((await localMarketplace.ownedDraftState(id)).title_ua).toBe(
      publicationFixture.titleUa,
    );
    await page.goto(path);
    await editor.expectSavedTitle();
  });

  test("the native close warning can keep the dirty tab open or discard only confirmed changes", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    page,
  }) => {
    const path = await editor.startDraft();
    const id = path.split("/").at(-1) ?? "";
    await editor.titleUa.click();
    await editor.titleUa.fill(recoveryFixture.localTitle);
    await expect(
      page.getByText("Незбережені зміни", { exact: true }),
    ).toBeVisible();
    const firstDialog = page.waitForEvent("dialog");
    const firstClose = page.close({ runBeforeUnload: true });
    const first = await firstDialog;
    expect(first.type()).toBe("beforeunload");
    await first.dismiss();
    await firstClose;
    expect(page.isClosed()).toBe(false);
    await expect(editor.titleUa).toHaveValue(recoveryFixture.localTitle);
    const secondDialog = page.waitForEvent("dialog");
    const closed = page.waitForEvent("close");
    await page.close({ runBeforeUnload: true });
    const second = await secondDialog;
    expect(second.type()).toBe("beforeunload");
    await second.accept();
    await closed;
    expect((await localMarketplace.ownedDraftState(id)).title_ua).toBe(
      publicationFixture.titleUa,
    );
  });

  test("sidebar navigation asks before discarding unsaved editor text", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    page,
  }) => {
    const path = await editor.startDraft();
    await editor.titleUa.fill(recoveryFixture.localTitle);
    await page
      .getByRole("link", { name: "Моя бібліотека", exact: true })
      .click();
    await editor.stayInEditor();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(editor.titleUa).toHaveValue(recoveryFixture.localTitle);
    await page
      .getByRole("link", { name: "Моя бібліотека", exact: true })
      .click();
    await editor.discardAndLeave();
    await expect(page).toHaveURL(/\/ua\/profile\/library$/);
    expect((await localMarketplace.ownedDraftStates())[0].title_ua).toBe(
      publicationFixture.titleUa,
    );
  });

  test("header navigation protects a file-only change and supports Escape cancellation", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    page,
  }) => {
    const path = await editor.startDraft();
    await editor.sourceInput.setInputFiles(recoveryFixture.replacement);
    const catalog = page
      .getByRole("link", { name: "Каталог", exact: true })
      .first();
    await catalog.click();
    await expect(editor.leaveDialog).toBeVisible();
    await expect(
      editor.leaveDialog.getByRole("button", {
        name: "Залишитися",
        exact: true,
      }),
    ).toBeFocused();
    await page.screenshot({
      path: "output/playwright/navigation-leave-dialog.png",
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    await expect(editor.leaveDialog).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(
      page.getByText(recoveryFixture.replacement.name, { exact: true }),
    ).toBeVisible();
    await catalog.click();
    await editor.discardAndLeave();
    await expect(page).toHaveURL(/\/ua\/catalog$/);
    expect(
      (await localMarketplace.ownedDraftStates())[0].source_asset_id,
    ).toBeNull();
  });

  test("mobile header keeps edits on cancellation and closes its menu after confirmed navigation", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await editor.open();
    await editor.titleUa.fill(recoveryFixture.localTitle);
    const menu = page.getByRole("button", { name: "Toggle menu", exact: true });
    await menu.click();
    const catalog = page
      .getByRole("link", { name: "Каталог", exact: true })
      .first();
    await catalog.click();
    await editor.stayInEditor();
    await expect(editor.titleUa).toHaveValue(recoveryFixture.localTitle);
    await expect(catalog).toBeVisible();
    await catalog.click();
    await editor.discardAndLeave();
    await expect(page).toHaveURL(/\/ua\/catalog$/);
    await expect(
      page.getByRole("link", { name: "Профіль", exact: true }),
    ).toBeHidden();
    await menu.click();
    await expect(
      page.getByRole("link", { name: "Профіль", exact: true }),
    ).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/ua\/profile\/uploads\/new$/);
    await expect(
      page.getByRole("link", { name: "Профіль", exact: true }),
    ).toBeHidden();
    expect(await localMarketplace.ownedDraftStates()).toHaveLength(0);
    await page.screenshot({
      path: "output/playwright/mobile-navigation-fixed.png",
      animations: "disabled",
    });
  });

  test("browser Back can be cancelled and then confirmed without saving local text", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    page,
  }) => {
    const path = await editor.startDraft();
    await editor.openDraftFromList(path);
    await editor.titleUa.fill(recoveryFixture.localTitle);
    await page.goBack();
    await editor.stayInEditor();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(editor.titleUa).toHaveValue(recoveryFixture.localTitle);
    await page.goBack();
    await editor.discardAndLeave();
    await expect(page).toHaveURL(/\/ua\/profile\/uploads$/);
    expect((await localMarketplace.ownedDraftStates())[0].title_ua).toBe(
      publicationFixture.titleUa,
    );
  });

  test("browser Forward can be cancelled and then confirmed without saving local text", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    page,
  }) => {
    const path = await editor.startDraft();
    await page
      .getByRole("link", { name: "Моя бібліотека", exact: true })
      .click();
    await expect(page).toHaveURL(/\/ua\/profile\/library$/);
    await page.goBack();
    await expect(editor.titleUa).toBeEnabled();
    await editor.titleUa.fill(recoveryFixture.localTitle);
    await page.goForward();
    await editor.stayInEditor();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(editor.titleUa).toHaveValue(recoveryFixture.localTitle);
    await page.goForward();
    await editor.discardAndLeave();
    await expect(page).toHaveURL(/\/ua\/profile\/library$/);
    expect((await localMarketplace.ownedDraftStates())[0].title_ua).toBe(
      publicationFixture.titleUa,
    );
  });

  test("clean and successfully saved editors allow navigation without confirmation", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    page,
  }) => {
    await editor.open();
    await page
      .getByRole("link", { name: "Моя бібліотека", exact: true })
      .click();
    await expect(page).toHaveURL(/\/ua\/profile\/library$/);
    expect(await localMarketplace.ownedDraftStates()).toHaveLength(0);
    const path = await editor.startDraft();
    await expect(editor.leaveDialog).toBeHidden();
    await editor.titleUa.fill(recoveryFixture.localTitle);
    await editor.saveConfirmedDraft();
    await page
      .getByRole("link", { name: "Моя бібліотека", exact: true })
      .click();
    await expect(page).toHaveURL(/\/ua\/profile\/library$/);
    await expect(editor.leaveDialog).toBeHidden();
    const draft = (await localMarketplace.ownedDraftStates())[0];
    expect(draft.id).toBe(path.split("/").at(-1));
    expect(draft.title_ua).toBe(recoveryFixture.localTitle);
  });

  test("confirmed deletion redirects a dirty draft without a second leave dialog", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    page,
  }) => {
    await editor.startDraft();
    await editor.titleUa.fill(recoveryFixture.localTitle);
    await page
      .getByRole("button", { name: "Видалити чернетку", exact: true })
      .click();
    await page
      .getByRole("alertdialog", { name: "Видалити цю чернетку?" })
      .getByRole("button", { name: "Продовжити", exact: true })
      .click();
    await expect(page).toHaveURL(/\/ua\/profile\/uploads$/);
    await expect(editor.leaveDialog).toBeHidden();
    expect(await localMarketplace.ownedDraftStates()).toHaveLength(0);
  });

  test("a confirmed native reload returns to saved text without persisting unsaved edits", async ({
    localMarketplace,
    publicationRecoveryPage: editor,
    page,
  }) => {
    const path = await editor.startDraft();
    const id = path.split("/").at(-1) ?? "";
    await editor.titleUa.click();
    await editor.titleUa.fill(recoveryFixture.localTitle);
    await expect(
      page.getByText("Незбережені зміни", { exact: true }),
    ).toBeVisible();
    const prompted = page.waitForEvent("dialog");
    const reloaded = page.reload();
    const dialog = await prompted;
    expect(dialog.type()).toBe("beforeunload");
    await dialog.accept();
    await reloaded;
    await editor.expectSavedTitle();
    expect((await localMarketplace.ownedDraftState(id)).title_ua).toBe(
      publicationFixture.titleUa,
    );
  });
});
