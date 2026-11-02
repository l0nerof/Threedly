import enMessages from "@/messages/en.json";
import uaMessages from "@/messages/ua.json";
import DownloadModelButton from "@/src/business/components/DownloadModelButton";
import {
  modelDownloadErrorKeys,
  modelDownloadQueryKeys,
} from "@/src/business/constants/modelDownload";
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
} from "../fixtures";
import {
  type MatchMediaController,
  installMatchMediaMock,
} from "../mocks/match-media";
import {
  createDeferredDownload,
  downloadActionMock,
  downloadRouterRefreshMock,
  downloadUiFixture,
} from "../mocks/model-download-ui";

vi.mock(
  "@/src/app/[locale]/(main-pages)/catalog/download-actions",
  async () => {
    const { downloadActionMock } = await import("../mocks/model-download-ui");
    return { downloadModelAction: downloadActionMock };
  },
);
vi.mock("next/navigation", async () => {
  const { createDownloadNavigationMock } =
    await import("../mocks/model-download-ui");
  return createDownloadNavigationMock();
});

let media: MatchMediaController;
let downloads: string[];
let queryClient: QueryClient;

function captureDownload(event: MouseEvent) {
  if (
    event.target instanceof HTMLAnchorElement &&
    event.target.hasAttribute("download")
  ) {
    event.preventDefault();
    downloads.push(event.target.href);
  }
}

function renderButton(
  options: {
    fileId?: string;
    fileName?: string;
    compact?: boolean;
    locale?: "ua" | "en";
  } = {},
) {
  const { locale = "en", ...buttonProps } = options;
  render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider
        locale={locale}
        messages={locale === "ua" ? uaMessages : enMessages}
      >
        <DownloadModelButton
          modelId={downloadUiFixture.modelId}
          {...buttonProps}
        />
        <Toaster />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  downloadActionMock
    .mockReset()
    .mockResolvedValue({ ok: true, url: downloadUiFixture.url });
  media = installMatchMediaMock();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  downloads = [];
  document.addEventListener("click", captureDownload, true);
});

afterEach(() => {
  toast.dismiss();
  document.removeEventListener("click", captureDownload, true);
  media.cleanup();
  queryClient.clear();
});

describe("DownloadModelButton", () => {
  it("starts the authorized attachment download and refreshes cached lists and server data", async () => {
    for (const key of modelDownloadQueryKeys)
      queryClient.setQueryData([...key, "unit-list"], ["cached"]);
    queryClient.setQueryData(["unrelated"], ["cached"]);
    renderButton();

    fireEvent.click(
      screen.getByRole("button", { name: enMessages.Downloads.button }),
    );

    await waitFor(() => expect(downloads).toEqual([downloadUiFixture.url]));
    expect(downloadActionMock).toHaveBeenCalledWith({
      modelId: downloadUiFixture.modelId,
    });
    expect(downloadRouterRefreshMock).toHaveBeenCalledOnce();
    for (const key of modelDownloadQueryKeys) {
      expect(
        queryClient.getQueryState([...key, "unit-list"])?.isInvalidated,
      ).toBe(true);
    }
    expect(queryClient.getQueryState(["unrelated"])?.isInvalidated).toBe(false);
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("blocks repeated clicks while pending and allows a free retry afterward", async () => {
    const deferred = createDeferredDownload();
    downloadActionMock.mockReturnValueOnce(deferred.promise);
    renderButton();
    const button = screen.getByRole("button", {
      name: enMessages.Downloads.button,
    });
    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });

    expect(downloadActionMock).toHaveBeenCalledOnce();
    expect(
      screen
        .getByRole("button", { name: enMessages.Downloads.pending })
        .getAttribute("aria-busy"),
    ).toBe("true");
    expect(button).toHaveProperty("disabled", true);
    expect(downloads).toEqual([]);

    await act(async () =>
      deferred.resolve({ ok: true, url: downloadUiFixture.url }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: enMessages.Downloads.button }),
    );
    await waitFor(() => expect(downloads).toHaveLength(2));
    expect(downloadActionMock).toHaveBeenCalledTimes(2);
  });

  it("sends an explicit file ID and names the compact control for assistive technology", async () => {
    renderButton({
      fileId: downloadUiFixture.file.id,
      fileName: downloadUiFixture.file.file_name,
      compact: true,
    });
    fireEvent.click(screen.getByRole("button", { name: "Download chair.obj" }));
    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloadActionMock).toHaveBeenCalledWith({
      modelId: downloadUiFixture.modelId,
      fileId: downloadUiFixture.file.id,
    });
  });

  it.each(Object.entries(modelDownloadErrorKeys))(
    "shows the localized %s failure without downloading or refreshing",
    async (error, key) => {
      const knownError = Object.keys(modelDownloadErrorKeys).find(
        (candidate): candidate is keyof typeof modelDownloadErrorKeys =>
          candidate === error,
      );
      if (!knownError) throw new Error("Unknown download error.");
      downloadActionMock.mockResolvedValueOnce({
        ok: false,
        error: knownError,
      });
      renderButton();
      fireEvent.click(
        screen.getByRole("button", { name: enMessages.Downloads.button }),
      );

      expect(
        await screen.findByText(enMessages.Downloads.errors[key]),
      ).toBeTruthy();
      expect(downloads).toEqual([]);
      expect(downloadRouterRefreshMock).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: enMessages.Downloads.button }),
        ).toHaveProperty("disabled", false),
      );
    },
  );

  it("handles a rejected action with a recoverable generic error", async () => {
    downloadActionMock.mockRejectedValueOnce(new Error("Network unavailable"));
    renderButton();
    fireEvent.click(
      screen.getByRole("button", { name: enMessages.Downloads.button }),
    );
    expect(
      await screen.findByText(enMessages.Downloads.errors.generic),
    ).toBeTruthy();
    expect(downloads).toEqual([]);
    fireEvent.click(
      screen.getByRole("button", { name: enMessages.Downloads.button }),
    );
    await waitFor(() => expect(downloads).toHaveLength(1));
  });

  it("renders the Ukrainian quota message", async () => {
    downloadActionMock.mockResolvedValueOnce({
      ok: false,
      error: "quota_exceeded",
    });
    renderButton({ locale: "ua" });
    fireEvent.click(
      screen.getByRole("button", { name: uaMessages.Downloads.button }),
    );
    expect(
      await screen.findByText(uaMessages.Downloads.errors.quotaExceeded),
    ).toBeTruthy();
    expect(downloads).toEqual([]);
  });
});
