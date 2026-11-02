import en from "@/messages/en.json";
import ua from "@/messages/ua.json";
import ProfileLibraryTabs from "@/src/app/[locale]/(main-pages)/profile/library/components/ProfileLibraryTabs";
import ProfileLibraryPage from "@/src/app/[locale]/(main-pages)/profile/library/page";
import { LocaleCode } from "@/src/business/constants/localization";
import type { ProfileLibraryPage as LibraryPageData } from "@/src/business/types/profileLibrary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
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
  within,
} from "../fixtures";
import {
  type MatchMediaController,
  installMatchMediaMock,
} from "../mocks/match-media";
import {
  createLibraryFixture,
  createLibraryModel,
  libraryDesigner,
  libraryMocks as mocks,
  resetLibraryMocks,
} from "../mocks/profile-library";

vi.mock("@/src/business/utils/supabase/server", async () => {
  const { libraryMocks } = await import("../mocks/profile-library");
  return { createClient: libraryMocks.createClient };
});
vi.mock("@/src/business/utils/supabase/client", async () => {
  const { libraryMocks } = await import("../mocks/profile-library");
  return {
    createClient: () => ({ auth: { getUser: libraryMocks.browserGetUser } }),
  };
});
vi.mock("next/navigation", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/navigation")>();
  const { createLibraryNavigationMock } =
    await import("../mocks/profile-library");
  return { ...original, ...createLibraryNavigationMock() };
});
vi.mock("next-intl/server", async () => {
  const { createLibraryServerIntlMock } =
    await import("../mocks/profile-library");
  return createLibraryServerIntlMock();
});
vi.mock(
  "@/src/app/[locale]/(main-pages)/catalog/download-actions",
  async () => {
    const { downloadActionMock } = await import("../mocks/model-download-ui");
    return { downloadModelAction: downloadActionMock };
  },
);

let queryClient: QueryClient;
let media: MatchMediaController;
beforeEach(() => {
  resetLibraryMocks();
  media = installMatchMediaMock();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
});
afterEach(() => {
  queryClient.clear();
  media.cleanup();
  vi.useRealTimers();
});

function providers(
  children: ReactNode,
  locale: LocaleCode = LocaleCode.English,
) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider
        locale={locale}
        messages={locale === "ua" ? ua : en}
      >
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

function renderTabs(
  library: LibraryPageData,
  locale: LocaleCode = LocaleCode.English,
) {
  mocks.pathname = `/${locale}/profile/library`;
  return render(
    providers(<ProfileLibraryTabs library={library} locale={locale} />, locale),
  );
}

async function renderPage(
  locale: LocaleCode = LocaleCode.English,
  query: Record<string, string | string[] | undefined> = {},
) {
  mocks.pathname = `/${locale}/profile/library`;
  const page = await ProfileLibraryPage({
    params: Promise.resolve({ locale }),
    searchParams: Promise.resolve(query),
  });
  return render(providers(page, locale));
}

describe("profile library tabs", () => {
  it("shows full totals rather than current page lengths and localized model links", () => {
    renderTabs(createLibraryFixture());
    expect(
      screen
        .getByRole("tab", { name: "Downloaded 1" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      screen.getByRole("tab", { name: "Favorite models 26" }),
    ).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Subscriptions 25" })).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Library model 1" })
        .getAttribute("href"),
    ).toBe("/en/catalog/library-model-1");
    expect(screen.queryByRole("navigation", { name: "pagination" })).toBeNull();
  });

  it("navigates to page two while preserving locale and unrelated URL state", async () => {
    mocks.search = "view=grid";
    renderTabs(
      createLibraryFixture({
        downloaded_count: 26,
        total_pages: 2,
        models: Array.from({ length: 24 }, (_, index) =>
          createLibraryModel(index + 1),
        ),
      }),
      LocaleCode.Ukrainian,
    );
    expect(screen.getByText("Сторінка 1 з 2")).toBeTruthy();
    await act(async () =>
      fireEvent.click(screen.getByRole("link", { name: "Далі" })),
    );
    expect(mocks.push).toHaveBeenCalledWith(
      "/ua/profile/library?view=grid&page=2",
      { scroll: false },
    );
  });

  it("restores the selected tab and page from server props and handles back-navigation props", () => {
    const library = createLibraryFixture({
      active_tab: "favoriteModels",
      current_page: 2,
      total_pages: 2,
      models: [createLibraryModel(25), createLibraryModel(26)],
    });
    const rendered = renderTabs(library);
    expect(
      screen
        .getByRole("tab", { name: "Favorite models 26" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByText("Page 2 of 2")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Library model 26" })).toBeTruthy();
    rendered.rerender(
      providers(
        <ProfileLibraryTabs
          library={createLibraryFixture()}
          locale={LocaleCode.English}
        />,
      ),
    );
    expect(
      screen
        .getByRole("tab", { name: "Downloaded 1" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.queryByRole("link", { name: "Library model 26" })).toBeNull();
  });

  it("resets page on tab change, retaining unrelated search parameters", async () => {
    mocks.search = "tab=favoriteModels&page=2&view=grid";
    renderTabs(
      createLibraryFixture({
        active_tab: "favoriteModels",
        current_page: 2,
        total_pages: 2,
        models: [createLibraryModel(25), createLibraryModel(26)],
      }),
    );
    await act(async () =>
      fireEvent.mouseDown(
        screen.getByRole("tab", { name: "Subscriptions 25" }),
        { button: 0, ctrlKey: false },
      ),
    );
    expect(mocks.push).toHaveBeenCalledWith(
      "/en/profile/library?tab=subscriptions&view=grid",
      { scroll: false },
    );
  });

  it("uses the first-page URL when navigating backward", async () => {
    mocks.search = "tab=favoriteModels&page=2";
    renderTabs(
      createLibraryFixture({
        active_tab: "favoriteModels",
        current_page: 2,
        total_pages: 2,
        models: [createLibraryModel(25), createLibraryModel(26)],
      }),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole("link", { name: "Previous" })),
    );
    expect(mocks.push).toHaveBeenCalledWith(
      "/en/profile/library?tab=favoriteModels",
      { scroll: false },
    );
  });

  it("does not navigate on the active tab or current page", async () => {
    renderTabs(
      createLibraryFixture({
        downloaded_count: 26,
        total_pages: 2,
        models: Array.from({ length: 24 }, (_, index) =>
          createLibraryModel(index + 1),
        ),
      }),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Downloaded 26" }));
      fireEvent.click(screen.getByRole("link", { name: "1" }));
    });
    expect(mocks.push).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole("link", { name: "Previous" })
        .getAttribute("aria-disabled"),
    ).toBe("true");
  });

  it("supports keyboard tab activation", async () => {
    renderTabs(createLibraryFixture());
    const active = screen.getByRole("tab", { name: "Downloaded 1" });
    active.focus();
    await act(async () => fireEvent.keyDown(active, { key: "ArrowRight" }));
    await act(async () =>
      fireEvent.keyDown(document.activeElement ?? active, { key: "Enter" }),
    );
    expect(mocks.push).toHaveBeenCalledWith(
      "/en/profile/library?tab=favoriteModels",
      { scroll: false },
    );
  });

  it.each(["downloaded", "favoriteModels", "subscriptions"] as const)(
    "renders the real empty state for %s",
    (active_tab) => {
      renderTabs(
        createLibraryFixture({
          active_tab,
          downloaded_count: 0,
          favorite_count: 0,
          followed_count: 0,
          models: [],
          designers: [],
        }),
      );
      const empty = en.Profile.library.empty[active_tab];
      expect(screen.getByText(empty.title)).toBeTruthy();
      expect(
        screen
          .getByRole("link", {
            name:
              active_tab === "subscriptions"
                ? "Browse designers"
                : "Browse catalog",
          })
          .getAttribute("href"),
      ).toBe(active_tab === "subscriptions" ? "/en/designers" : "/en/catalog");
    },
  );

  it("renders a real designer card and its untruncated model count", () => {
    renderTabs(
      createLibraryFixture({
        active_tab: "subscriptions",
        followed_count: 1,
        models: [],
        designers: [libraryDesigner],
      }),
    );
    expect(
      screen.getByRole("link", { name: /library_studio/ }).getAttribute("href"),
    ).toContain("/en/designers/library_studio");
    expect(screen.getByText(/1,001|1001/)).toBeTruthy();
  });
});

describe("profile library page", () => {
  it("renders full header counts and the validated active page", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", { name: "My Library", level: 1 }),
    ).toBeTruthy();
    expect(
      within(screen.getByRole("group", { name: "Favorite models" })).getByText(
        "26",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByRole("group", { name: "Subscriptions" })).getByText(
        "25",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Library model 1" })).toBeTruthy();
  });

  it("renders Ukrainian counts and links", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: createLibraryFixture({ favorite_count: 1234 }),
      error: null,
    });
    await renderPage(LocaleCode.Ukrainian);
    expect(
      screen.getByRole("heading", { name: "Моя бібліотека" }),
    ).toBeTruthy();
    expect(
      within(screen.getByRole("group", { name: "Улюблені моделі" })).getByText(
        /1\s234/,
      ),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Модель бібліотеки 1" })
        .getAttribute("href"),
    ).toBe("/ua/catalog/library-model-1");
  });

  it.each([LocaleCode.English, LocaleCode.Ukrainian])(
    "redirects guests to the %s login page",
    async (locale) => {
      mocks.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });
      await expect(renderPage(locale)).rejects.toThrow(
        `Redirect: /${locale}/login`,
      );
    },
  );

  it("rejects invalid locales before reading data", async () => {
    await expect(
      ProfileLibraryPage({
        params: Promise.resolve({ locale: "de" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("Not found");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("redirects an out-of-range page to the last available page, preserving other query state", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: createLibraryFixture({
        active_tab: "favoriteModels",
        current_page: 2,
        total_pages: 2,
        models: [createLibraryModel(25), createLibraryModel(26)],
      }),
      error: null,
    });
    await expect(
      renderPage(LocaleCode.English, {
        tab: "favoriteModels",
        page: "99",
        view: "grid",
      }),
    ).rejects.toThrow(
      "Redirect: /en/profile/library?tab=favoriteModels&page=2&view=grid",
    );
  });

  it("shows errors instead of fake zero counts or an empty library and preserves the retry section", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "private SQL detail" },
    });
    await renderPage(LocaleCode.Ukrainian, { tab: "subscriptions", page: "2" });
    expect(screen.getByRole("alert").textContent).toContain(
      ua.Profile.library.loadError,
    );
    expect(screen.queryAllByRole("group")).toHaveLength(0);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByText(/private SQL/)).toBeNull();
    expect(
      screen
        .getByRole("link", { name: ua.Profile.library.retry })
        .getAttribute("href"),
    ).toBe("/ua/profile/library?tab=subscriptions&page=2");
  });

  it("shows a distinct timeout state", async () => {
    vi.useFakeTimers();
    mocks.maybeSingle.mockReturnValueOnce(new Promise<never>(() => {}));
    const page = ProfileLibraryPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    await vi.advanceTimersByTimeAsync(10_000);
    render(providers(await page));
    expect(screen.getByRole("alert").textContent).toContain(
      en.Profile.library.loadTimeout,
    );
  });
});
