import { readFile } from "node:fs/promises";
import { expect, test } from "../fixtures";
import {
  demoCredentials,
  localMutationTestsEnabled,
  publicationFixture,
} from "../fixtures/model-publication";
import { STORAGE_STATE_PATH, isDemoSessionAvailable } from "../global-setup";

test("guest cannot open the publication editor", async ({ page }) => {
  await page.goto("/ua/profile/uploads/new");
  await expect(page).toHaveURL(/\/ua\/login$/);
});

test.describe("publication editor — local demo", () => {
  test.skip(!isDemoSessionAvailable(), "Demo user session is unavailable");
  test.use({ storageState: STORAGE_STATE_PATH });

  test.beforeEach(async ({ page, loginPage }) => {
    await page.context().clearCookies();
    await loginPage.open();
    await loginPage.fillAndSubmit(
      demoCredentials.email,
      demoCredentials.password,
    );
    await page.waitForURL(/\/ua\/?$/, { waitUntil: "commit" });
  });

  test("rejects unsupported files and keeps an incomplete publication disabled", async ({
    publicationPage,
    page,
  }) => {
    await publicationPage.open();
    await expect(publicationPage.publishButton).toBeDisabled();
    await publicationPage.sourceInput.setInputFiles(
      publicationFixture.invalidSource,
    );
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Перевірте поля, тип файлу й обмеження розміру." }),
    ).toBeVisible();
    await expect(
      page.getByText("Оберіть файл вашої моделі", { exact: true }),
    ).toBeVisible();
    await expect(publicationPage.saveButton).toBeDisabled();
    await expect(publicationPage.publishButton).toBeDisabled();
  });

  test("mobile preview preserves local content and restores keyboard focus", async ({
    publicationPage,
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await publicationPage.open();
    await publicationPage.fillContent();
    await publicationPage.expectTextPadding();
    await publicationPage.expectReadiness(2);
    await publicationPage.readiness.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("mobile-publication-readiness.png"),
      fullPage: false,
      animations: "disabled",
    });
    await publicationPage.previewButton.click();
    await publicationPage.expectPreviewReturnOnLeft();
    await expect(
      publicationPage.preview.getByRole("heading", {
        name: publicationFixture.titleUa,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      publicationPage.preview.getByText(publicationFixture.descriptionUa, {
        exact: true,
      }),
    ).toBeVisible();
    await publicationPage.preview
      .getByRole("button", { name: "English", exact: true })
      .click();
    await expect(
      publicationPage.preview.getByRole("heading", {
        name: publicationFixture.titleEn,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      publicationPage.preview.getByRole("button", {
        name: "Скачування після публікації",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(publicationPage.preview).toBeInViewport();
    await page.screenshot({
      path: testInfo.outputPath("mobile-preview.png"),
      fullPage: false,
      animations: "disabled",
    });
    await publicationPage.returnToEditor();
    await expect(publicationPage.titleUa).toHaveValue(
      publicationFixture.titleUa,
    );
    await expect(publicationPage.saveButton).toBeEnabled();
    await expect(page).toHaveURL(/\/uploads\/new$/);
  });

  test.describe("persistent local flows", () => {
    test.skip(
      !localMutationTestsEnabled,
      "Set THREEDLY_E2E_LOCAL_MUTATIONS=1 only with the local Supabase stack",
    );

    test("category search and readiness explain a complete draft without optional descriptions", async ({
      publicationPage,
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await publicationPage.open();
      await publicationPage.expectReadiness(0);
      await publicationPage.expectTextPadding();
      await expect(publicationPage.publishButton).toBeDisabled();
      await publicationPage.titleUa.fill(publicationFixture.titleUa);
      await publicationPage.expectReadiness(1);
      await page.getByRole("tab", { name: "English", exact: true }).click();
      await publicationPage.titleEn.fill(publicationFixture.titleEn);
      await publicationPage.expectReadiness(2);
      await expect(publicationPage.descriptionEn).toHaveValue("");
      await page.getByRole("tab", { name: "Українська", exact: true }).click();
      await expect(publicationPage.descriptionUa).toHaveValue("");

      await publicationPage.category.fill("no-matching-category");
      await expect(
        page.getByText("Категорії не знайдено.", { exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("option")).toHaveCount(0);
      await publicationPage.category.press("Escape");
      await expect(page.getByRole("listbox")).toBeHidden();
      await expect(publicationPage.category).toBeFocused();

      await publicationPage.category.fill("МЕБЛІ");
      const chairs = page.getByRole("option", { name: "Стільці", exact: true });
      await expect(chairs).toBeVisible();
      await expect(chairs.getByText("Меблі", { exact: true })).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Дивани", exact: true }),
      ).toBeVisible();
      await publicationPage.category.fill("стіль");
      await expect(chairs).toBeVisible();
      await publicationPage.category.fill("Стільці");
      await expect(page.getByRole("option")).toHaveCount(1);
      await publicationPage.category.press("ArrowDown");
      await publicationPage.category.press("Enter");
      await expect(publicationPage.category).toHaveValue("Стільці");
      await publicationPage.expectReadiness(3);
      await page
        .getByRole("button", { name: "Очистити категорію", exact: true })
        .click();
      await expect(publicationPage.category).toHaveValue("");
      await publicationPage.expectReadiness(2);
      await expect(publicationPage.publishButton).toBeDisabled();

      await publicationPage.category.fill("Стільці");
      await expect(page.getByRole("option")).toHaveCount(1);
      await publicationPage.category.press("ArrowDown");
      await publicationPage.category.press("Enter");
      await publicationPage.expectReadiness(3);
      await publicationPage.sourceInput.setInputFiles(
        publicationFixture.source,
      );
      await publicationPage.expectReadiness(4);
      await publicationPage.coverInput.setInputFiles(publicationFixture.cover);
      await publicationPage.expectReadiness(5);
      await expect(publicationPage.publishButton).toBeEnabled();
      await expect(publicationPage.descriptionUa).toHaveValue("");
      await expect(publicationPage.descriptionEn).toHaveValue("");
      await page.screenshot({
        path: testInfo.outputPath("desktop-publication-readiness.png"),
        fullPage: true,
        animations: "disabled",
      });

      await publicationPage.previewButton.click();
      await publicationPage.expectPreviewReturnOnLeft();
      await page.screenshot({
        path: testInfo.outputPath("desktop-preview-return.png"),
        fullPage: false,
        animations: "disabled",
      });
      await publicationPage.returnToEditor();
      await publicationPage.expectReadiness(5);
      await expect(page).toHaveURL(/\/uploads\/new$/);
    });

    test("deletes only its own saved draft from the list after confirmation", async ({
      publicationPage,
      page,
    }) => {
      let draftPath: string | null = null;
      try {
        await publicationPage.open();
        await publicationPage.titleUa.fill(publicationFixture.titleUa);
        draftPath = await publicationPage.save();
        await page.goto("/ua/profile/uploads");
        const row = publicationPage.draftRow(draftPath);
        await expect(row).toBeVisible();
        const remove = row.getByRole("button", {
          name: "Видалити чернетку",
          exact: true,
        });
        await remove.click();
        const confirmation = page.getByRole("alertdialog", {
          name: "Видалити цю чернетку?",
          exact: true,
        });
        await expect(confirmation).toBeVisible();
        await confirmation
          .getByRole("button", { name: "Залишитися", exact: true })
          .click();
        await expect(confirmation).toBeHidden();
        await expect(row).toBeVisible();
        await expect(page).toHaveURL(/\/ua\/profile\/uploads$/);
        await remove.click();
        await confirmation
          .getByRole("button", { name: "Продовжити", exact: true })
          .click();
        await expect(confirmation).toBeHidden();
        await expect(row).toHaveCount(0);
        draftPath = null;
        await page.reload();
        await expect(row).toHaveCount(0);
      } finally {
        if (draftPath) await publicationPage.deleteDraft(draftPath);
      }
    });

    test("preview does not autosave; explicit partial save survives reload and can be deleted", async ({
      publicationPage,
      page,
    }) => {
      let draftPath: string | null = null;
      try {
        await publicationPage.open();
        await publicationPage.titleUa.fill(publicationFixture.titleUa);
        await publicationPage.previewButton.click();
        await expect(
          publicationPage.preview.getByRole("heading", {
            name: publicationFixture.titleUa,
            exact: true,
          }),
        ).toBeVisible();
        await publicationPage.preview
          .getByRole("button", { name: "English", exact: true })
          .click();
        await expect(
          publicationPage.preview.getByRole("heading", {
            name: "Цією мовою назви ще немає",
            exact: true,
          }),
        ).toBeVisible();
        await publicationPage.closePreview();
        const otherPage = await page.context().newPage();
        try {
          await otherPage.goto("/ua/profile/uploads");
          await expect(
            otherPage.getByRole("link", { name: "Створити модель" }),
          ).toBeVisible();
          await expect(
            otherPage.getByRole("article", {
              name: publicationFixture.titleUa,
              exact: true,
            }),
          ).toHaveCount(0);
        } finally {
          await otherPage.close();
        }
        await page
          .getByRole("link", { name: "Мої моделі", exact: true })
          .last()
          .click();
        const leave = page.getByRole("alertdialog", {
          name: "Вийти без збереження?",
        });
        await expect(leave).toBeVisible();
        await leave
          .getByRole("button", { name: "Залишитися", exact: true })
          .click();
        await expect(publicationPage.titleUa).toHaveValue(
          publicationFixture.titleUa,
        );
        draftPath = await publicationPage.save();
        await page.reload();
        await expect(publicationPage.titleUa).toHaveValue(
          publicationFixture.titleUa,
        );
        await expect(publicationPage.publishButton).toBeDisabled();
        await page.goto("/ua/profile/uploads");
        await page
          .getByRole("article", {
            name: publicationFixture.titleUa,
            exact: true,
          })
          .getByRole("link", { name: "Продовжити", exact: true })
          .click();
        await expect(page).toHaveURL(new RegExp(`${draftPath}$`));
        await expect(publicationPage.titleUa).toHaveValue(
          publicationFixture.titleUa,
        );
      } finally {
        if (draftPath) await publicationPage.deleteDraft(draftPath);
      }
    });

    test("real files survive save and publish; downloads preserve bytes and count once per month", async ({
      publicationPage,
      page,
    }, testInfo) => {
      test.setTimeout(90_000);
      let draftPath: string | null = null;
      let published = false;
      try {
        await page.goto("/ua/profile");
        const downloads = page.getByRole("group", {
          name: "Завантаження за місяць",
          exact: true,
        });
        const usedBefore = await downloads
          .locator('[data-slot="card-title"]')
          .innerText();
        const remaining = await page
          .getByRole("group", { name: "Залишилось завантажень", exact: true })
          .locator('[data-slot="card-title"]')
          .innerText();
        expect(Number(remaining)).toBeGreaterThan(0);
        await publicationPage.open();
        await publicationPage.fillContent();
        await page
          .getByRole("combobox", { name: "Категорія", exact: true })
          .click();
        await page
          .getByRole("option", { name: "Стільці", exact: true })
          .click();
        await publicationPage.chooseFiles();
        await publicationPage.previewButton.click();
        await publicationPage.preview
          .getByRole("tab", { name: "Файли та формати", exact: true })
          .click();
        await expect(
          publicationPage.preview.getByText(publicationFixture.source.name, {
            exact: true,
          }),
        ).toBeVisible();
        await publicationPage.closePreview();
        draftPath = await publicationPage.save();
        await page.reload();
        await expect(publicationPage.titleUa).toHaveValue(
          publicationFixture.titleUa,
        );
        await expect(
          page.getByText(publicationFixture.source.name, { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("img", {
            name: publicationFixture.titleUa,
            exact: true,
          }),
        ).toBeVisible();
        await expect(publicationPage.publishButton).toBeEnabled();
        await publicationPage.publishButton.click();
        await expect(
          page.getByRole("heading", {
            name: "Модель опублікована",
            exact: true,
          }),
        ).toBeVisible({ timeout: 20_000 });
        published = true;
        await publicationPage.expectPublishedSuccess();
        await page.reload();
        await publicationPage.expectPublishedSuccess();
        await page.screenshot({
          path: testInfo.outputPath("published-success.png"),
          fullPage: false,
          animations: "disabled",
        });
        await page.goto("/ua/catalog");
        await page
          .getByRole("textbox", { name: "Пошук у каталозі" })
          .fill(publicationFixture.titleUa);
        const model = page.getByRole("article").filter({
          has: page.getByRole("heading", {
            name: publicationFixture.titleUa,
            exact: true,
          }),
        });
        await expect(model).toBeVisible();
        await model.getByRole("link").first().click();
        await expect(
          page.getByRole("heading", {
            level: 1,
            name: publicationFixture.titleUa,
            exact: true,
          }),
        ).toBeVisible();
        const modelPath = new URL(page.url()).pathname;
        await page
          .getByRole("tab", { name: "Файли та формати", exact: true })
          .click();
        const downloadButton = page.getByRole("button", {
          name: `Завантажити ${publicationFixture.source.name}`,
          exact: true,
        });
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const downloadEvent = page.waitForEvent("download");
          await downloadButton.click();
          const download = await downloadEvent;
          expect(download.suggestedFilename()).toBe(
            publicationFixture.source.name,
          );
          const path = await download.path();
          if (!path)
            throw new Error("Playwright did not retain the downloaded file");
          expect(await readFile(path)).toEqual(
            publicationFixture.source.buffer,
          );
          await expect(downloadButton).toBeEnabled();
        }
        await page.screenshot({
          path: testInfo.outputPath("published-model.png"),
          fullPage: true,
        });
        await page.goto("/ua/profile");
        await expect(downloads.locator('[data-slot="card-title"]')).toHaveText(
          String(Number(usedBefore) + 1),
        );
        await page.goto("/ua/profile/library");
        await expect(
          page.getByRole("link", {
            name: publicationFixture.titleUa,
            exact: true,
          }),
        ).toHaveAttribute("href", modelPath);
        await page.goto("/ua/profile/uploads");
        const owned = page.getByRole("article", {
          name: publicationFixture.titleUa,
          exact: true,
        });
        await owned
          .getByRole("button", { name: "Редагувати", exact: true })
          .click();
        const edit = page.getByRole("dialog", {
          name: "Редагування моделі",
          exact: true,
        });
        const updatedDescription =
          "Опис змінено після публікації через Playwright.";
        await edit
          .getByLabel("Опис українською", { exact: true })
          .fill(updatedDescription);
        await edit
          .getByRole("button", { name: "Зберегти зміни", exact: true })
          .click();
        await expect(edit).toBeHidden();
        await page.goto(modelPath);
        await expect(
          page.getByText(updatedDescription, { exact: true }),
        ).toBeVisible();
        await page.goto("/ua/profile/uploads");
        await owned
          .getByRole("button", { name: "Архівувати", exact: true })
          .click();
        await expect(
          owned.getByRole("button", { name: "Опублікувати", exact: true }),
        ).toBeEnabled();
        await page.goto(modelPath);
        await expect(
          page.getByRole("link", { name: /повернутися|back.to.home/i }),
        ).toBeVisible();
        await page.goto("/ua/profile/uploads");
        await owned
          .getByRole("button", { name: "Опублікувати", exact: true })
          .click();
        await expect(
          owned.getByRole("button", { name: "Архівувати", exact: true }),
        ).toBeEnabled();
        await page.goto(modelPath);
        await expect(
          page.getByRole("heading", {
            level: 1,
            name: publicationFixture.titleUa,
            exact: true,
          }),
        ).toBeVisible();
      } finally {
        if (published) await publicationPage.deletePublishedModel();
        else if (draftPath) await publicationPage.deleteDraft(draftPath);
      }
    });
  });
});
