import { type Locator, type Page, expect } from "@playwright/test";
import ua from "../../messages/ua.json";
import { publicationFixture } from "../fixtures/model-publication";
import { BasePage } from "./base.page";

export class PublicationPage extends BasePage {
  readonly titleUa: Locator;
  readonly titleEn: Locator;
  readonly descriptionUa: Locator;
  readonly descriptionEn: Locator;
  readonly category: Locator;
  readonly readiness: Locator;
  readonly saveButton: Locator;
  readonly publishButton: Locator;
  readonly previewButton: Locator;
  readonly preview: Locator;
  readonly sourceInput: Locator;
  readonly coverInput: Locator;

  constructor(page: Page) {
    super(page);
    this.titleUa = page.getByLabel("Назва українською", { exact: true });
    this.titleEn = page.getByLabel("Назва англійською", { exact: true });
    this.descriptionUa = page.getByLabel("Опис українською", { exact: true });
    this.descriptionEn = page.getByLabel("Опис англійською", { exact: true });
    this.category = page.getByRole("combobox", {
      name: "Категорія",
      exact: true,
    });
    this.readiness = page.getByRole("complementary", {
      name: "Готовність до публікації",
      exact: true,
    });
    this.saveButton = page.getByRole("button", {
      name: "Зберегти чернетку",
      exact: true,
    });
    this.publishButton = page.getByRole("button", {
      name: "Опублікувати",
      exact: true,
    });
    this.previewButton = page.getByRole("button", {
      name: "Переглянути сторінку",
    });
    this.preview = page.getByRole("dialog", {
      name: "Попередній перегляд публікації",
    });
    this.sourceInput = page.locator(
      'input[type="file"][aria-label="Обрати файл"]',
    );
    this.coverInput = page.locator(
      'input[type="file"][aria-label="Обрати обкладинку"]',
    );
  }

  async open() {
    await this.goto("/ua/profile/uploads/new");
    await expect(this.titleUa).toBeEnabled();
  }

  async fillContent() {
    await this.titleUa.fill(publicationFixture.titleUa);
    await this.descriptionUa.fill(publicationFixture.descriptionUa);
    await this.page.getByRole("tab", { name: "English", exact: true }).click();
    await this.titleEn.fill(publicationFixture.titleEn);
    await this.descriptionEn.fill(publicationFixture.descriptionEn);
    await this.page
      .getByRole("tab", { name: "Українська", exact: true })
      .click();
  }

  async chooseFiles() {
    await this.sourceInput.setInputFiles(publicationFixture.source);
    await this.coverInput.setInputFiles(publicationFixture.cover);
    await expect(
      this.page.getByRole("img", {
        name: publicationFixture.titleUa,
        exact: true,
      }),
    ).toBeVisible();
  }

  async save() {
    await this.saveButton.click();
    await expect(this.page.locator('form[aria-busy="false"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(this.saveButton).toBeDisabled();
    await expect(
      this.page.getByText("Немає незбережених змін", { exact: true }),
    ).toBeVisible();
    await this.page.waitForURL(/\/ua\/profile\/uploads\/[\da-f-]{36}$/, {
      waitUntil: "commit",
    });
    return new URL(this.page.url()).pathname;
  }

  async closePreview() {
    await this.preview
      .getByRole("button", { name: "Повернутися до редагування" })
      .press("Escape");
    await expect(this.preview).toBeHidden();
    await expect(this.previewButton).toBeFocused();
  }

  async returnToEditor() {
    await this.preview
      .getByRole("button", { name: "Повернутися до редагування", exact: true })
      .click();
    await expect(this.preview).toBeHidden();
    await expect(this.previewButton).toBeFocused();
  }

  async expectReadiness(completed: number) {
    const progress = this.readiness.getByRole("progressbar", {
      name: "Готовність до публікації",
      exact: true,
    });
    await expect(progress).toHaveAttribute("value", String(completed));
    await expect(progress).toHaveAttribute("max", "5");
    await expect(
      this.readiness.getByText(
        `${completed} із 5 обов’язкових пунктів готові`,
        {
          exact: true,
        },
      ),
    ).toBeVisible();
    await expect(this.readiness.getByRole("listitem")).toHaveCount(5);
  }

  async expectTextPadding() {
    for (const field of [this.titleUa, this.descriptionUa]) {
      await expect(field).toBeVisible();
      const padding = await field.evaluate((element) => {
        const style = getComputedStyle(element);
        return [
          style.paddingLeft,
          style.paddingRight,
          style.paddingTop,
          style.paddingBottom,
        ].map((value) => Number.parseFloat(value));
      });
      for (const value of padding) expect(value).toBeGreaterThanOrEqual(12);
    }
  }

  async expectPreviewReturnOnLeft() {
    await expect(this.preview).toBeInViewport({ ratio: 1 });
    const back = this.preview.getByRole("button", {
      name: "Повернутися до редагування",
      exact: true,
    });
    const heading = this.preview.getByRole("heading", {
      name: "Попередній перегляд публікації",
      exact: true,
    });
    await expect(back).toBeVisible();
    await expect(heading).toBeVisible();
    const [backBox, headingBox] = await Promise.all([
      back.boundingBox(),
      heading.boundingBox(),
    ]);
    const viewport = this.page.viewportSize();
    if (!backBox || !headingBox || !viewport)
      throw new Error("Preview header geometry is unavailable");
    expect(backBox.x + backBox.width / 2).toBeLessThan(viewport.width / 2);
    expect(backBox.x).toBeLessThanOrEqual(headingBox.x + 1);
    expect(backBox.y).toBeLessThanOrEqual(headingBox.y + 1);
  }

  draftRow(path: string) {
    return this.page.getByRole("article").filter({
      has: this.page.locator(`a[href="${path}"]`),
    });
  }

  async expectPublishedSuccess() {
    await expect(
      this.page.getByRole("heading", {
        level: 1,
        name: "Модель опублікована",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("link", { name: "Мої моделі", exact: true }).last(),
    ).toHaveAttribute("href", "/ua/profile/uploads");
    await expect(
      this.page.getByRole("link", { name: "Створити ще модель", exact: true }),
    ).toHaveAttribute("href", "/ua/profile/uploads/new");
    await expect(
      this.page.getByText(ua.Profile.uploads.editor.manualSave, {
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      this.page.getByText(ua.Profile.uploads.editor.savedState, {
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(this.saveButton).toHaveCount(0);
    await expect(this.publishButton).toHaveCount(0);
    await expect(this.readiness).toHaveCount(0);
    await expect(
      this.page.getByRole("button", {
        name: "Повторити очищення файлів",
        exact: true,
      }),
    ).toHaveCount(0, { timeout: 20_000 });
  }

  async deleteDraft(path: string) {
    await this.page.goto(path);
    await this.page
      .getByRole("button", { name: "Видалити чернетку", exact: true })
      .click();
    const dialog = this.page.getByRole("alertdialog", {
      name: "Видалити цю чернетку?",
    });
    await dialog
      .getByRole("button", { name: "Продовжити", exact: true })
      .click();
    await expect(this.page).toHaveURL(/\/ua\/profile\/uploads$/);
    await expect(
      this.page.getByRole("link", { name: "Створити модель" }),
    ).toBeVisible();
    await expect(this.page.locator(`a[href="${path}"]`)).toHaveCount(0);
  }

  async deletePublishedModel() {
    await this.page.goto("/ua/profile/uploads");
    const model = this.page.getByRole("article", {
      name: publicationFixture.titleUa,
      exact: true,
    });
    await model.getByRole("button", { name: "Видалити", exact: true }).click();
    await this.page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Видалити назавжди", exact: true })
      .click();
    await expect(this.page.getByRole("alertdialog")).toBeHidden();
    await this.page.reload();
    await expect(model).toHaveCount(0);
  }
}
