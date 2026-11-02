import en from "@/messages/en.json";
import ua from "@/messages/ua.json";
import ProfileUploadsPage from "@/src/app/[locale]/(main-pages)/profile/uploads/page";
import { favoritesQueryKeys } from "@/src/business/queries/favorites";
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
import {
  type MatchMediaController,
  installMatchMediaMock,
} from "../mocks/match-media";
import {
  modelManagementFixture as fixture,
  modelManagementMocks as mocks,
  modelManagementRouter as router,
} from "../mocks/model-management";
import {
  editorMocks,
  resetEditorMocks,
} from "../mocks/model-publication-editor";

vi.mock("@/src/business/utils/supabase/server", async () => {
  const { editorMocks } = await import("../mocks/model-publication-editor");
  return { createClient: editorMocks.serverClient };
});
vi.mock("next/navigation", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/navigation")>();
  const { createModelManagementNavigationMock } =
    await import("../mocks/model-management");
  return { ...original, ...createModelManagementNavigationMock() };
});
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const { default: enMessages } = await import("@/messages/en.json");
  const { default: uaMessages } = await import("@/messages/ua.json");
  return {
    setRequestLocale: vi.fn(),
    getTranslations: async ({ locale }: { locale: string }) =>
      createTranslator({
        locale,
        messages: locale === "ua" ? uaMessages : enMessages,
        namespace: "Profile",
      }),
  };
});

let client: QueryClient;
let media: MatchMediaController;
beforeEach(() => {
  resetEditorMocks();
  media = installMatchMediaMock();
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
    },
  });
  client.setQueryData(favoritesQueryKeys.currentUser(), fixture.user.id);
});
afterEach(() => {
  client.clear();
  media.cleanup();
  vi.useRealTimers();
});
const page = (
  locale = "en",
  searchParams: Record<string, string | string[] | undefined> = {},
) =>
  ProfileUploadsPage({
    params: Promise.resolve({ locale }),
    searchParams: Promise.resolve(searchParams),
  });
async function renderPage(
  locale: "en" | "ua" = "en",
  query: Record<string, string | string[] | undefined> = {},
) {
  const content = await page(locale, query);
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        locale={locale}
        messages={locale === "ua" ? ua : en}
      >
        {content}
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe("profile uploads page", () => {
  it("hides the previous owner's rows when the active account changes", async () => {
    await renderPage();
    expect(
      screen.getByRole("article", { name: fixture.model.title_en }),
    ).not.toBeNull();
    await act(async () => {
      client.setQueryData(favoritesQueryKeys.currentUser(), null);
      client.setQueryData(favoritesQueryKeys.sessionRevision(), 1);
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("article", { name: fixture.model.title_en }),
      ).toBeNull(),
    );
    expect(screen.getByRole("status").textContent).toBe(
      en.Profile.uploads.management.sessionUnavailable,
    );
  });
  it("does not invent zero size for a model with missing file metadata", async () => {
    mocks.listResult.mockResolvedValueOnce({
      data: [{ ...fixture.listRow, file_format: null, file_size_bytes: null }],
      error: null,
    });
    await renderPage();
    const article = screen.getByRole("article", {
      name: fixture.model.title_en,
    });
    expect(article.textContent).toContain(
      en.Profile.uploads.list.unknownFormat,
    );
    expect(article.textContent).toContain(en.Profile.uploads.list.unknownSize);
    expect(article.textContent).not.toContain("0 MB");
  });
  it.each(["en", "ua"] as const)(
    "renders actual owned models, drafts and the create entry in %s",
    async (locale) => {
      await renderPage(locale);
      const messages = locale === "ua" ? ua : en;
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: messages.Profile.uploads.title,
        }),
      ).not.toBeNull();
      const title =
        locale === "ua" ? fixture.model.title_ua : fixture.model.title_en;
      expect(
        within(screen.getByRole("article", { name: title })).getByRole(
          "heading",
          { level: 3, name: title },
        ),
      ).not.toBeNull();
      expect(
        screen
          .getByRole("link", { name: messages.Profile.uploads.editor.create })
          .getAttribute("href"),
      ).toBe(`/${locale}/profile/uploads/new`);
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: messages.Profile.uploads.editor.draftsTitle,
        }),
      ).not.toBeNull();
      expect(
        screen.queryByLabelText(messages.Profile.uploads.form.titleEn),
      ).toBeNull();
      expect(
        screen.getByRole("button", {
          name: messages.Profile.uploads.management.edit,
        }),
      ).not.toBeNull();
      expect(document.body.textContent).not.toContain("object_path");
    },
  );
  it("shows a genuine empty state, not an error", async () => {
    mocks.countResult.mockResolvedValueOnce({ count: 0, error: null });
    await renderPage();
    expect(screen.getByText(en.Profile.uploads.empty.title)).not.toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("shows a retryable failure instead of a fake empty list or upload form", async () => {
    mocks.profileSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "private" },
    });
    await renderPage("ua");
    expect(screen.getByRole("alert").textContent).toBe(
      ua.Profile.uploads.loadError,
    );
    expect(screen.queryByText(ua.Profile.uploads.empty.title)).toBeNull();
    expect(screen.queryByLabelText(ua.Profile.uploads.form.titleEn)).toBeNull();
    expect(
      screen
        .getByRole("link", { name: ua.Profile.uploads.management.retry })
        .getAttribute("href"),
    ).toBe("/ua/profile/uploads");
  });
  it("keeps valid management controls when categories fail", async () => {
    mocks.categoriesResult.mockResolvedValueOnce({
      data: null,
      error: { message: "offline" },
    });
    await renderPage();
    expect(
      screen.getByRole("heading", { level: 3, name: fixture.model.title_en }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: en.Profile.uploads.management.edit }),
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("button", {
        name: en.Profile.uploads.management.archive,
      }),
    ).toHaveProperty("disabled", false);
    expect(screen.queryByLabelText(en.Profile.uploads.form.titleEn)).toBeNull();
  });
  it("renders the full count and navigates through the existing pagination", async () => {
    mocks.countResult.mockResolvedValueOnce({ count: 6, error: null });
    await renderPage("en", { page: "2" });
    expect(screen.getByText("Showing 6–6 of 6 models")).not.toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "Previous page" }));
    expect(router.push).toHaveBeenCalledWith("?", { scroll: false });
  });
  it("redirects an out-of-range page while retaining other URL parameters", async () => {
    await expect(
      page("ua", { page: "99", tag: ["one", "two"], source: "profile" }),
    ).rejects.toMatchObject({
      digest:
        "NEXT_REDIRECT;replace;/ua/profile/uploads?page=1&tag=one&tag=two&source=profile;307;",
    });
  });
  it.each(["en", "ua"])(
    "redirects a guest to the localized %s login",
    async (locale) => {
      mocks.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });
      await expect(page(locale)).rejects.toMatchObject({
        digest: `NEXT_REDIRECT;replace;/${locale}/login;307;`,
      });
    },
  );
  it("rejects unsupported locales before any data access", async () => {
    await expect(page("invalid")).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
    expect(editorMocks.serverClient).not.toHaveBeenCalled();
  });
  it("renders a bounded timeout with a localized retry", async () => {
    vi.useFakeTimers();
    mocks.countResult.mockReturnValueOnce(new Promise(() => {}));
    const result = page("ua");
    await vi.advanceTimersByTimeAsync(10_000);
    const content = await result;
    vi.useRealTimers();
    render(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider locale="ua" messages={ua}>
          {content}
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      ua.Profile.uploads.management.errors.timeout,
    );
    expect(
      screen
        .getByRole("link", { name: ua.Profile.uploads.management.retry })
        .getAttribute("href"),
    ).toBe("/ua/profile/uploads");
  });
});
