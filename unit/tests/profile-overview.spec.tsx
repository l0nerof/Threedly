import en from "@/messages/en.json";
import ua from "@/messages/ua.json";
import { fetchProfileOverviewData } from "@/src/app/[locale]/(main-pages)/profile/actions";
import ProfilePage from "@/src/app/[locale]/(main-pages)/profile/page";
import {
  PLAN_LABELS,
  marketplacePlanKeys,
} from "@/src/business/constants/plans";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  render,
  screen,
} from "../fixtures";
import {
  profileOverviewFixture as fixture,
  profileOverviewMocks as mocks,
  resetProfileOverviewMocks,
} from "../mocks/profile-overview";

vi.mock("@/src/business/utils/supabase/server", async () => {
  const { profileOverviewMocks } = await import("../mocks/profile-overview");
  return { createClient: profileOverviewMocks.createClient };
});
vi.mock("next/navigation", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/navigation")>();
  const { createProfileNavigationMock } =
    await import("../mocks/profile-overview");
  return { ...original, ...createProfileNavigationMock() };
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

beforeEach(resetProfileOverviewMocks);
afterEach(() => vi.useRealTimers());

describe("profile overview action", () => {
  it("returns validated statistics using the current session and a parameterless RPC", async () => {
    expect(await fetchProfileOverviewData()).toEqual({
      ok: true,
      overview: fixture.overview,
    });
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("get_profile_overview");
    expect(mocks.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it("strips unexpected private fields from the response", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: {
        ...fixture.overview,
        email: "private@example.test",
        can_upload: true,
      },
      error: null,
    });
    expect(await fetchProfileOverviewData()).toEqual({
      ok: true,
      overview: fixture.overview,
    });
  });

  it("rejects guests without querying statistics", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    expect(await fetchProfileOverviewData()).toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each([400, 401, 403])(
    "handles an expired/invalid session with auth status %s",
    async (status) => {
      mocks.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { status, message: "private auth detail" },
      });
      expect(await fetchProfileOverviewData()).toEqual({
        ok: false,
        error: "unauthorized",
      });
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );

  it("does not treat an Auth service outage as a guest", async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { status: 500, message: "private auth detail" },
    });
    expect(await fetchProfileOverviewData()).toEqual({
      ok: false,
      error: "generic",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("handles an unavailable server context", async () => {
    mocks.createClient.mockRejectedValueOnce(new Error("Request unavailable"));
    expect(await fetchProfileOverviewData()).toEqual({
      ok: false,
      error: "generic",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("preserves Next.js control-flow errors instead of rendering a fake data failure", async () => {
    expect.assertions(2);
    const original =
      await vi.importActual<typeof import("next/navigation")>(
        "next/navigation",
      );
    try {
      original.redirect("/en/login");
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      mocks.createClient.mockRejectedValueOnce(error);
      await expect(fetchProfileOverviewData()).rejects.toBe(error);
      expect(mocks.rpc).not.toHaveBeenCalled();
    }
  });

  it("handles a rejected Auth request", async () => {
    mocks.getUser.mockRejectedValueOnce(new Error("Connection unavailable"));
    expect(await fetchProfileOverviewData()).toEqual({
      ok: false,
      error: "generic",
    });
  });

  it("handles RPC failures without returning raw errors or fabricated numbers", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "private SQL detail" },
    });
    expect(await fetchProfileOverviewData()).toEqual({
      ok: false,
      error: "generic",
    });
  });

  it("treats a missing profile as a read error rather than a zero-usage Free account", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect(await fetchProfileOverviewData()).toEqual({
      ok: false,
      error: "generic",
    });
  });

  it.each([
    { profile_id: "00000000-0000-0000-0000-00000000f002" },
    { profile_id: "invalid" },
    { plan_key: "admin" },
    { downloads_limit_monthly: -1 },
    { downloads_limit_monthly: 1.5 },
    { downloads_used_this_month: "3" },
    { downloads_used_this_month: -1 },
    { downloads_used_this_month: Number.MAX_SAFE_INTEGER + 1 },
    { published_uploads: null },
    { published_uploads: Number.NaN },
    { favorite_models: -1 },
    { favorite_models: Infinity },
  ])("rejects foreign or malformed statistics", async (overrides) => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: { ...fixture.overview, ...overrides },
      error: null,
    });
    expect(await fetchProfileOverviewData()).toEqual({
      ok: false,
      error: "generic",
    });
  });

  it.each(["createClient", "getUser", "maybeSingle"] as const)(
    "bounds a stalled %s to ten seconds",
    async (stage) => {
      vi.useFakeTimers();
      mocks[stage].mockReturnValueOnce(new Promise(() => {}));
      const result = fetchProfileOverviewData();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await result).toEqual({ ok: false, error: "timeout" });
      expect(vi.getTimerCount()).toBe(0);
      if (stage === "maybeSingle")
        expect(mocks.abortSignal).toHaveBeenCalledWith(
          expect.objectContaining({ aborted: true }),
        );
    },
  );

  it("shares one deadline across Auth and the RPC", async () => {
    vi.useFakeTimers();
    mocks.getUser.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () => resolve({ data: { user: fixture.user }, error: null }),
            9_000,
          );
        }),
    );
    mocks.maybeSingle.mockReturnValueOnce(new Promise(() => {}));
    const result = fetchProfileOverviewData();
    await vi.advanceTimersByTimeAsync(9_000);
    expect(mocks.rpc).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(await result).toEqual({ ok: false, error: "timeout" });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears the deadline on success", async () => {
    vi.useFakeTimers();
    expect((await fetchProfileOverviewData()).ok).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

async function renderOverview(locale: "en" | "ua" = "en") {
  const content = await ProfilePage({ params: Promise.resolve({ locale }) });
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ua" ? ua : en}
    >
      {content}
    </NextIntlClientProvider>,
  );
}

describe("profile overview page", () => {
  it.each(marketplacePlanKeys)(
    "shows the actual %s plan and statistics",
    async (plan) => {
      mocks.maybeSingle.mockResolvedValueOnce({
        data: { ...fixture.overview, plan_key: plan },
        error: null,
      });
      await renderOverview();
      expect(screen.getByText(`${PLAN_LABELS[plan]} plan`)).toBeTruthy();
      expect(
        screen.getByRole("group", {
          name: en.Profile.overview.stats.downloads.label,
        }).textContent,
      ).toContain("3");
      expect(
        screen.getByRole("group", {
          name: en.Profile.overview.stats.remaining.label,
        }).textContent,
      ).toContain("22");
      expect(
        screen.getByRole("group", {
          name: en.Profile.overview.stats.uploads.label,
        }).textContent,
      ).toContain("7");
      expect(
        screen.getByRole("group", {
          name: en.Profile.overview.stats.favorites.label,
        }).textContent,
      ).toContain("11");
      expect(
        screen
          .getByRole("link", { name: en.Profile.overview.continue.cta })
          .getAttribute("href"),
      ).toBe("/en/profile/library");
      expect(screen.queryByText("No activity yet.")).toBeNull();
      expect(
        screen.queryByText(
          "You have no downloaded models yet. Start from the catalog.",
        ),
      ).toBeNull();
    },
  );

  it("shows the real allowance when current-month usage is zero", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: { ...fixture.overview, downloads_used_this_month: 0 },
      error: null,
    });
    await renderOverview();
    expect(
      screen.getByRole("group", {
        name: en.Profile.overview.stats.remaining.label,
      }).textContent,
    ).toContain("25");
  });

  it.each([0, 2])(
    "clamps remaining downloads at zero for a lowered limit of %s",
    async (limit) => {
      mocks.maybeSingle.mockResolvedValueOnce({
        data: { ...fixture.overview, downloads_limit_monthly: limit },
        error: null,
      });
      await renderOverview();
      expect(
        screen.getByRole("group", {
          name: en.Profile.overview.stats.remaining.label,
        }).textContent,
      ).toContain("0");
      expect(screen.queryByText("-3")).toBeNull();
    },
  );

  it("renders Ukrainian copy and locale-formatted values without fixed Free-plan claims", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: { ...fixture.overview, published_uploads: 1534 },
      error: null,
    });
    await renderOverview("ua");
    expect(screen.getByText("План Pro")).toBeTruthy();
    expect(
      screen.getByRole("group", {
        name: ua.Profile.overview.stats.uploads.label,
      }).textContent,
    ).toContain(new Intl.NumberFormat("uk-UA").format(1534));
    expect(
      screen
        .getByRole("link", { name: ua.Profile.overview.continue.cta })
        .getAttribute("href"),
    ).toBe("/ua/profile/library");
    expect(screen.getByText(ua.Profile.overview.quota.rules)).toBeTruthy();
  });

  it("shows an actionable error without a fake plan or statistics", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "private database error" },
    });
    await renderOverview();
    expect(screen.getByRole("alert").textContent).toBe(
      en.Profile.overview.loadError,
    );
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.queryByText("Free plan")).toBeNull();
    expect(screen.queryByText("private database error")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: en.Profile.overview.retry })
        .getAttribute("href"),
    ).toBe("/en/profile");
  });

  it("renders a distinct timeout error", async () => {
    vi.useFakeTimers();
    mocks.maybeSingle.mockReturnValueOnce(new Promise(() => {}));
    const content = ProfilePage({ params: Promise.resolve({ locale: "en" }) });
    await vi.advanceTimersByTimeAsync(10_000);
    const page = await content;
    vi.useRealTimers();
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        {page}
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      en.Profile.overview.loadTimeout,
    );
  });

  it.each(["en", "ua"])(
    "redirects a guest to the localized %s login",
    async (locale) => {
      mocks.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });
      await expect(
        ProfilePage({ params: Promise.resolve({ locale }) }),
      ).rejects.toThrow(`Redirect: /${locale}/login`);
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );

  it("rejects unsupported locales before loading private data", async () => {
    await expect(
      ProfilePage({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("Not found");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
