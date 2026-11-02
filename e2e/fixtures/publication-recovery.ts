import type { Page } from "@playwright/test";

export const recoveryFixture = {
  localTitle: "Локальний текст, який ще не збережено",
  remoteTitle: "Текст, збережений в іншій вкладці",
  recoveredTitle: "Текст після узгодження версій",
  replacement: {
    name: "recovery-replacement.obj",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("o Replacement\nv 0 0 0\nv 2 0 0\nv 0 2 0\nf 1 2 3\n"),
  },
  storageError:
    "Передавання файлу не вдалося. Підтверджений вміст збережено; повторіть передавання решти файлів.",
  conflictError:
    "Чернетку змінили в іншому місці. Локальні зміни залишилися; перед новим записом завантажте збережену версію.",
};

export async function createPublicationNetworkControls(page: Page) {
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  return {
    async blockSourceUploads() {
      await session.send("Network.setBlockedURLs", {
        urls: [
          "http://127.0.0.1:54321/storage/v1/object/model-draft-files/*",
          "http://localhost:54321/storage/v1/object/model-draft-files/*",
        ],
      });
    },
    async restore() {
      await session.send("Network.setBlockedURLs", { urls: [] });
    },
    async dispose() {
      if (!page.isClosed()) {
        await session.send("Network.setBlockedURLs", { urls: [] });
        await session.detach();
      }
    },
  };
}

export type PublicationNetworkControls = Awaited<
  ReturnType<typeof createPublicationNetworkControls>
>;
