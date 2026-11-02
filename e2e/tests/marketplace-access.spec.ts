import { expect, test } from "../fixtures";
import type { AccessModel } from "../fixtures/local-marketplace";
import {
  localMutationTestsEnabled,
  publicationFixture,
} from "../fixtures/model-publication";

test.describe("marketplace access — isolated local accounts", () => {
  test.skip(
    !localMutationTestsEnabled,
    "Enable only with the local Supabase stack",
  );
  test.setTimeout(90_000);

  test("guest download requires login and records no usage", async ({
    localMarketplace,
    marketplaceAccessPage,
  }) => {
    const model = await localMarketplace.createModel("free", "guest");
    await marketplaceAccessPage.openModel(model);
    await marketplaceAccessPage.expectDownloadDenied(
      "Увійдіть в акаунт, щоб завантажувати моделі.",
    );
    expect((await localMarketplace.readerState()).downloads).toHaveLength(0);
  });

  test("Free cannot download a Pro model and consumes no quota", async ({
    localMarketplace,
    marketplaceAccessPage,
  }) => {
    const model = await localMarketplace.createModel("pro", "pro-only");
    await marketplaceAccessPage.login(localMarketplace.reader);
    await marketplaceAccessPage.openModel(model);
    await marketplaceAccessPage.expectDownloadDenied(
      "Ваш поточний план не надає доступу до цієї моделі.",
    );
    expect((await localMarketplace.readerState()).downloads).toHaveLength(0);
    await marketplaceAccessPage.expectQuota(0, 5);
  });

  test("Free downloads five models, blocks the sixth, and can repeat a previous model", async ({
    localMarketplace,
    marketplaceAccessPage,
    page,
  }, testInfo) => {
    const models: AccessModel[] = [];
    for (let index = 1; index <= 6; index += 1)
      models.push(await localMarketplace.createModel("free", `quota-${index}`));
    await marketplaceAccessPage.login(localMarketplace.reader);
    expect((await localMarketplace.readerState()).downloads_limit_monthly).toBe(
      5,
    );
    for (const model of models.slice(0, 5)) {
      await marketplaceAccessPage.openModel(model);
      await marketplaceAccessPage.download();
    }
    await marketplaceAccessPage.expectQuota(5, 0);
    await marketplaceAccessPage.openModel(models[5]);
    await marketplaceAccessPage.expectDownloadDenied(
      "Місячний ліміт завантажень вичерпано. Моделі, які ви вже завантажували цього місяця, можна завантажувати повторно.",
    );
    await page.screenshot({
      path: testInfo.outputPath("quota-denied.png"),
      animations: "disabled",
    });
    await marketplaceAccessPage.openModel(models[0]);
    await marketplaceAccessPage.download();
    await marketplaceAccessPage.expectQuota(5, 0);
    const state = await localMarketplace.readerState();
    expect(state.downloads).toHaveLength(5);
    expect(state.downloads.map((row) => row.model_id).sort()).toEqual(
      models
        .slice(0, 5)
        .map((model) => model.id)
        .sort(),
    );
  });

  test("an account without creator access cannot start an upload", async ({
    localMarketplace,
    marketplaceAccessPage,
    page,
  }) => {
    await marketplaceAccessPage.login(localMarketplace.reader);
    await page.goto("/ua/profile/uploads/new");
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Право автора на upload недоступне." }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Назва українською", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Опублікувати", exact: true }),
    ).toHaveCount(0);
    expect(await localMarketplace.publishedModelCount()).toBe(0);
  });

  test("another creator cannot open a private draft or read its files", async ({
    localMarketplace,
    marketplaceAccessPage,
    publicationPage,
    page,
  }) => {
    await marketplaceAccessPage.login(localMarketplace.owner);
    await publicationPage.open();
    await publicationPage.fillContent();
    await publicationPage.chooseFiles();
    const path = await publicationPage.save();
    const assets = await localMarketplace.ownedDraftAssets(
      path.split("/").at(-1) ?? "",
    );
    expect(assets).toHaveLength(2);
    for (const asset of assets) {
      const ownerRead = await localMarketplace.readPrivateAsset(
        localMarketplace.owner.id,
        asset,
      );
      expect(ownerRead.error).toBeNull();
      if (!ownerRead.data) throw new Error("Owner's private file is missing");
      const expected =
        asset.kind === "source"
          ? publicationFixture.source.buffer
          : publicationFixture.cover.buffer;
      expect(Buffer.from(await ownerRead.data.arrayBuffer())).toEqual(expected);
      const foreignRead = await localMarketplace.readPrivateAsset(
        localMarketplace.other.id,
        asset,
      );
      expect(foreignRead.error).not.toBeNull();
      expect(foreignRead.data).toBeNull();
    }
    await marketplaceAccessPage.login(localMarketplace.other);
    await page.goto(path);
    await expect(
      page.getByRole("link", { name: /повернутися|back.to.home/i }),
    ).toBeVisible();
    await expect(publicationPage.titleUa).toHaveCount(0);
    await marketplaceAccessPage.login(localMarketplace.owner);
    await page.goto(path);
    await expect(publicationPage.titleUa).toHaveValue(
      publicationFixture.titleUa,
    );
    await publicationPage.deleteDraft(path);
  });

  test("revoked upload rejects a stale editor's file save but preserves metadata editing and deletion", async ({
    localMarketplace,
    marketplaceAccessPage,
    publicationPage,
    page,
  }) => {
    await marketplaceAccessPage.login(localMarketplace.owner);
    await publicationPage.open();
    await publicationPage.fillContent();
    await publicationPage.chooseFiles();
    const path = await publicationPage.save();
    const draftId = path.split("/").at(-1) ?? "";
    const originalAssets = await localMarketplace.ownedDraftAssets(draftId);
    await localMarketplace.revokeUpload();
    await publicationPage.sourceInput.setInputFiles({
      ...publicationFixture.source,
      name: "replacement.obj",
    });
    await publicationPage.saveButton.click();
    await expect(
      page.getByRole("alert").filter({
        hasText:
          "Право автора недоступне. Завантаження файлів і публікацію вимкнено.",
      }),
    ).toBeVisible();
    expect(await localMarketplace.ownedDraftAssets(draftId)).toEqual(
      originalAssets,
    );
    await expect(publicationPage.sourceInput).toBeDisabled();
    await page
      .getByRole("button", { name: "Скасувати зміну файлу", exact: true })
      .click();
    const updated = "Текст після відкликання права автора";
    await publicationPage.titleUa.fill(updated);
    await publicationPage.save();
    await page.reload();
    await expect(publicationPage.titleUa).toHaveValue(updated);
    await expect(publicationPage.sourceInput).toBeDisabled();
    await expect(publicationPage.coverInput).toBeDisabled();
    await expect(publicationPage.publishButton).toBeDisabled();
    expect(await localMarketplace.publishedModelCount()).toBe(0);
    await marketplaceAccessPage.deleteDraftAfterRevocation(path);
  });

  test("revoked creator permission blocks publishing from an already open complete draft", async ({
    localMarketplace,
    marketplaceAccessPage,
    publicationPage,
    page,
  }, testInfo) => {
    await marketplaceAccessPage.login(localMarketplace.owner);
    await publicationPage.open();
    await publicationPage.fillContent();
    await page
      .getByRole("combobox", { name: "Категорія", exact: true })
      .click();
    await page.getByRole("option", { name: "Стільці", exact: true }).click();
    await publicationPage.chooseFiles();
    const path = await publicationPage.save();
    await expect(publicationPage.publishButton).toBeEnabled();
    await localMarketplace.revokeUpload();
    await publicationPage.publishButton.click();
    await expect(
      page.getByRole("alert").filter({
        hasText:
          "Право автора недоступне. Завантаження файлів і публікацію вимкнено.",
      }),
    ).toBeVisible();
    await expect(publicationPage.publishButton).toBeDisabled();
    await expect(publicationPage.titleUa).toHaveValue(
      publicationFixture.titleUa,
    );
    expect(await localMarketplace.publishedModelCount()).toBe(0);
    await page.screenshot({
      path: testInfo.outputPath("publication-denied.png"),
      animations: "disabled",
    });
    await marketplaceAccessPage.deleteDraftAfterRevocation(path);
  });
});
