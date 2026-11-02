import { expect, test } from "../fixtures";
import {
  localMutationTestsEnabled,
  publicationFixture,
} from "../fixtures/model-publication";

const savedUsername = "e2e_profile_renamed";
const savedBio = "E2E: профіль автора після ручного збереження.";
const replacementAvatar = {
  name: "replacement.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQYlWPQyNv3Hx9mGBkKAF3clMGO+3EHAAAAAElFTkSuQmCC",
    "base64",
  ),
};
const invalidUsernames = [
  { label: "already taken", value: "e2e_access_other" },
  { label: "empty", value: "" },
  { label: "too short", value: "x" },
  { label: "too long", value: "e2e_username_too_long_" },
  { label: "unsupported characters", value: "bad name!" },
];
const rejectedAvatars = [
  {
    label: "unsupported MIME type",
    file: {
      name: "avatar.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    },
  },
  {
    label: "larger than 5 MiB",
    file: {
      name: "large-avatar.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    },
  },
];

test.describe("profile settings — isolated local accounts", () => {
  test.skip(
    !localMutationTestsEnabled,
    "Enable only with the local Supabase stack",
  );
  test.setTimeout(90_000);

  test("username and bio persist, normalize and update the public profile", async ({
    localMarketplace,
    marketplaceAccessPage,
    profileSettingsPage: settings,
    page,
    browser,
  }, testInfo) => {
    await marketplaceAccessPage.login(localMarketplace.owner);
    const original = await localMarketplace.ownerProfile();
    await settings.open();
    await settings.expectProfile(
      original.username,
      original.bio ?? "",
      localMarketplace.owner.email,
    );
    await settings.usernameInput.fill(`  ${savedUsername.toUpperCase()}  `);
    await settings.bioInput.fill(`  ${savedBio}  `);
    await expect(settings.saveButton).toBeEnabled();
    await settings.saveButton.click();
    await settings.expectSaveResult(true);
    await expect(settings.saveButton).toBeDisabled();
    expect(await localMarketplace.ownerProfile()).toEqual({
      ...original,
      username: savedUsername,
      bio: savedBio,
    });
    await page.reload();
    await settings.expectProfile(
      savedUsername,
      savedBio,
      localMarketplace.owner.email,
    );
    await page.screenshot({
      path: testInfo.outputPath("profile-saved.png"),
      animations: "disabled",
    });

    const guest = await browser.newPage();
    try {
      await guest.goto(`/ua/designers/${savedUsername}`);
      await expect(
        guest.getByRole("heading", {
          level: 1,
          name: `@${savedUsername}`,
          exact: true,
        }),
      ).toBeVisible();
      await expect(guest.getByText(savedBio, { exact: true })).toBeVisible();
      await guest.goto(`/ua/designers/${original.username}`);
      await expect(
        guest.getByRole("heading", {
          level: 1,
          name: `@${original.username} ще не публікує моделі`,
          exact: true,
        }),
      ).toBeVisible();
    } finally {
      await guest.close();
    }
  });

  for (const invalid of invalidUsernames) {
    test(`rejects ${invalid.label} username without changing the saved profile`, async ({
      localMarketplace,
      marketplaceAccessPage,
      profileSettingsPage: settings,
      page,
    }) => {
      await marketplaceAccessPage.login(localMarketplace.owner);
      const original = await localMarketplace.ownerProfile();
      await settings.open();
      await settings.expectProfile(
        original.username,
        original.bio ?? "",
        localMarketplace.owner.email,
      );
      await settings.usernameInput.fill(invalid.value);
      await settings.bioInput.fill(savedBio);
      await settings.saveButton.click();
      await settings.expectSaveResult(false);
      await expect(settings.saveButton).toBeEnabled();
      await expect(settings.usernameInput).toHaveValue(invalid.value);
      await expect(settings.bioInput).toHaveValue(savedBio);
      expect(await localMarketplace.ownerProfile()).toEqual(original);
      await page.reload();
      await settings.expectProfile(
        original.username,
        original.bio ?? "",
        localMarketplace.owner.email,
      );
    });
  }

  test("mobile avatar upload, replacement and removal persist without losing unsaved bio", async ({
    localMarketplace,
    marketplaceAccessPage,
    profileSettingsPage: settings,
    page,
    browser,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await marketplaceAccessPage.login(localMarketplace.owner);
    const original = await localMarketplace.ownerProfile();
    await settings.open();
    await settings.expectProfile(
      original.username,
      original.bio ?? "",
      localMarketplace.owner.email,
    );
    await expect(settings.avatarImage).toHaveCount(0);
    await settings.bioInput.fill(savedBio);
    await settings.chooseAvatar(publicationFixture.cover);
    await settings.expectSaveResult(true);
    const uploaded = await localMarketplace.ownerProfile();
    expect(uploaded.bio).toBe(original.bio);
    expect(uploaded.avatar_path).toBeTruthy();
    if (!uploaded.avatar_path)
      throw new Error("Uploaded avatar path is missing");
    await settings.expectAvatarLoaded(uploaded.avatar_path);
    expect(await localMarketplace.ownerAvatarPaths()).toEqual([
      uploaded.avatar_path,
    ]);
    expect(
      await localMarketplace.ownerAvatarBytes(uploaded.avatar_path),
    ).toEqual(publicationFixture.cover.buffer);
    await expect(settings.bioInput).toHaveValue(savedBio);
    await expect(settings.saveButton).toBeEnabled();
    await settings.saveButton.click();
    await expect
      .poll(async () => (await localMarketplace.ownerProfile()).bio)
      .toBe(savedBio);
    await expect(settings.saveButton).toBeDisabled();
    await page.reload();
    await settings.expectProfile(
      original.username,
      savedBio,
      localMarketplace.owner.email,
    );
    await settings.expectAvatarLoaded(uploaded.avatar_path);

    await settings.chooseAvatar(replacementAvatar);
    await settings.expectSaveResult(true);
    await expect
      .poll(async () => (await localMarketplace.ownerProfile()).avatar_path)
      .not.toBe(uploaded.avatar_path);
    const replaced = await localMarketplace.ownerProfile();
    if (!replaced.avatar_path)
      throw new Error("Replacement avatar path is missing");
    await settings.expectAvatarLoaded(replaced.avatar_path);
    expect(await localMarketplace.ownerAvatarPaths()).toEqual([
      replaced.avatar_path,
    ]);
    expect(
      await localMarketplace.ownerAvatarBytes(replaced.avatar_path),
    ).toEqual(replacementAvatar.buffer);
    await page.reload();
    await settings.expectAvatarLoaded(replaced.avatar_path);
    await page.screenshot({
      path: testInfo.outputPath("mobile-avatar.png"),
      animations: "disabled",
    });

    const guest = await browser.newPage();
    try {
      await guest.goto(`/ua/designers/${original.username}`);
      const publicAvatar = guest.getByRole("img", {
        name: `Аватар @${original.username}`,
        exact: true,
      });
      await expect(publicAvatar).toBeVisible();
      await expect
        .poll(() =>
          publicAvatar.evaluate(
            (image: HTMLImageElement) => image.naturalWidth,
          ),
        )
        .toBeGreaterThan(0);
      await settings.removeAvatar();
      expect(await localMarketplace.ownerProfile()).toEqual({
        ...original,
        bio: savedBio,
        avatar_path: null,
      });
      expect(await localMarketplace.ownerAvatarPaths()).toEqual([]);
      await page.reload();
      await settings.expectProfile(
        original.username,
        savedBio,
        localMarketplace.owner.email,
      );
      await expect(settings.avatarImage).toHaveCount(0);
      await guest.reload();
      await expect(publicAvatar).toHaveCount(0);
    } finally {
      await guest.close();
    }
  });

  for (const rejected of rejectedAvatars) {
    test(`rejects avatar ${rejected.label} and preserves the existing file and text`, async ({
      localMarketplace,
      marketplaceAccessPage,
      profileSettingsPage: settings,
      page,
    }) => {
      await marketplaceAccessPage.login(localMarketplace.owner);
      const original = await localMarketplace.ownerProfile();
      await settings.open();
      await settings.expectProfile(
        original.username,
        original.bio ?? "",
        localMarketplace.owner.email,
      );
      await settings.chooseAvatar(publicationFixture.cover);
      await settings.expectSaveResult(true);
      const uploaded = await localMarketplace.ownerProfile();
      if (!uploaded.avatar_path)
        throw new Error("Uploaded avatar path is missing");
      await settings.expectAvatarLoaded(uploaded.avatar_path);
      await settings.bioInput.fill(savedBio);
      await settings.chooseAvatar(rejected.file);
      await settings.expectSaveResult(false);
      await expect(settings.bioInput).toHaveValue(savedBio);
      await expect(settings.saveButton).toBeEnabled();
      expect(await localMarketplace.ownerProfile()).toEqual(uploaded);
      expect(await localMarketplace.ownerAvatarPaths()).toEqual([
        uploaded.avatar_path,
      ]);
      expect(
        await localMarketplace.ownerAvatarBytes(uploaded.avatar_path),
      ).toEqual(publicationFixture.cover.buffer);
      await page.reload();
      await settings.expectProfile(
        original.username,
        original.bio ?? "",
        localMarketplace.owner.email,
      );
      await settings.expectAvatarLoaded(uploaded.avatar_path);
    });
  }
});
