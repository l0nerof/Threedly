import { type Page, expect } from "@playwright/test";
import { publicationFixture } from "../fixtures/model-publication";
import { PublicationPage } from "./publication.page";

export class PublicationRecoveryPage extends PublicationPage {
  constructor(page: Page) {
    super(page);
  }

  async startDraft(withFiles = false, complete = false) {
    await this.open();
    await this.fillContent();
    if (complete) {
      await this.page
        .getByRole("combobox", { name: "Категорія", exact: true })
        .click();
      await this.page
        .getByRole("option", { name: "Стільці", exact: true })
        .click();
    }
    if (withFiles) await this.chooseFiles();
    await this.saveConfirmedDraft();
    await expect(this.page).toHaveURL(/\/ua\/profile\/uploads\/[\da-f-]{36}$/);
    return new URL(this.page.url()).pathname;
  }

  async expectFailure(message: string) {
    await expect(
      this.page.getByRole("alert").filter({ hasText: message }),
    ).toBeVisible();
    await expect(this.page.locator('form[aria-busy="false"]')).toBeVisible();
  }

  async saveConfirmedDraft() {
    await this.saveButton.click();
    await expect(this.page.locator('form[aria-busy="false"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(this.saveButton).toBeDisabled();
    await expect(
      this.page.getByText("Немає незбережених змін", { exact: true }),
    ).toBeVisible();
  }

  async openSavedVersionConfirmation() {
    await this.page
      .getByRole("button", {
        name: "Завантажити збережену версію",
        exact: true,
      })
      .click();
    return this.page.getByRole("alertdialog", {
      name: "Завантажити збережену версію?",
    });
  }

  async backConfirmation() {
    await this.page
      .getByRole("link", { name: "Мої моделі", exact: true })
      .last()
      .click();
    return this.leaveDialog;
  }

  get leaveDialog() {
    return this.page.getByRole("alertdialog", {
      name: "Вийти без збереження?",
    });
  }

  async stayInEditor() {
    await expect(this.leaveDialog).toBeVisible();
    await this.leaveDialog
      .getByRole("button", { name: "Залишитися", exact: true })
      .click();
    await expect(this.leaveDialog).toBeHidden();
  }

  async discardAndLeave() {
    await expect(this.leaveDialog).toBeVisible();
    await this.leaveDialog
      .getByRole("button", { name: "Продовжити", exact: true })
      .click();
    await expect(this.leaveDialog).toBeHidden();
  }

  async openDraftFromList(path: string) {
    await this.page
      .getByRole("link", { name: "Мої моделі", exact: true })
      .first()
      .click();
    await expect(this.page).toHaveURL(/\/ua\/profile\/uploads$/);
    await this.page.locator(`a[href="${path}"]`).click();
    await expect(this.page).toHaveURL(new RegExp(`${path}$`));
    await expect(this.titleUa).toBeEnabled();
  }

  async expectSavedTitle() {
    await expect(this.titleUa).toHaveValue(publicationFixture.titleUa);
  }
}
