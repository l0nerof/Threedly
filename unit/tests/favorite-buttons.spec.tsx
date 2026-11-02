import en from "@/messages/en.json";
import ua from "@/messages/ua.json";
import FavoriteModelButton from "@/src/business/components/FavoriteModelButton";
import FollowDesignerButton from "@/src/business/components/FollowDesignerButton";
import { favoritesQueryKeys } from "@/src/business/queries/favorites";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
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
  deferredFavorite,
  executeFavoriteRequest,
  favoriteDatabaseFailure,
  favoriteRouter,
  favoriteFixture as fixture,
  favoriteMocks as mocks,
  resetFavoriteMocks,
  favoriteMockState as state,
} from "../mocks/favorites";
import {
  type MatchMediaController,
  installMatchMediaMock,
} from "../mocks/match-media";

vi.mock("@/src/business/utils/supabase/client", async () => {
  const { createFavoriteClientMock } = await import("../mocks/favorites");
  return { createClient: createFavoriteClientMock };
});
vi.mock("next/navigation", async () => {
  const { createFavoriteNavigationMock } = await import("../mocks/favorites");
  return createFavoriteNavigationMock();
});

let client: QueryClient;
let media: MatchMediaController;
beforeEach(() => {
  resetFavoriteMocks();
  media = installMatchMediaMock();
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 60_000 },
    },
  });
});
afterEach(() => {
  client.clear();
  toast.dismiss();
  media.cleanup();
  vi.useRealTimers();
});

function renderButtons(children: ReactNode, locale: "en" | "ua" = "en") {
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        locale={locale}
        messages={locale === "ua" ? ua : en}
      >
        {children}
        <Toaster />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

async function ready(name: string) {
  const button = await screen.findByRole("button", { name });
  await waitFor(() => expect(button).toHaveProperty("disabled", false));
  return button;
}

describe("favorite and follow controls", () => {
  it("hides saving controls for confirmed guests", async () => {
    state.user = null;
    renderButtons(
      <>
        <FavoriteModelButton modelId={fixture.modelId} />
        <FollowDesignerButton designerId={fixture.designerId} />
      </>,
    );
    await waitFor(() =>
      expect(client.getQueryData(favoritesQueryKeys.currentUser())).toBeNull(),
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it("keeps self-follow hidden", async () => {
    renderButtons(<FollowDesignerButton designerId={fixture.user.id} />);
    await waitFor(() =>
      expect(client.getQueryData(favoritesQueryKeys.currentUser())).toBe(
        fixture.user.id,
      ),
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it.each(["model", "designer"] as const)(
    "adds and removes %s, refreshes server data and preserves unrelated caches",
    async (kind) => {
      client.setQueryData(["catalog", "sentinel"], { keep: true });
      renderButtons(
        kind === "model" ? (
          <FavoriteModelButton modelId={fixture.modelId} />
        ) : (
          <FollowDesignerButton designerId={fixture.designerId} />
        ),
      );
      const add = kind === "model" ? "Add to favorites" : "Follow designer";
      const remove =
        kind === "model" ? "Remove from favorites" : "Unfollow designer";
      fireEvent.click(await ready(add));
      expect((await ready(remove)).getAttribute("aria-pressed")).toBe("true");
      await waitFor(() =>
        expect(favoriteRouter.refresh).toHaveBeenCalledTimes(1),
      );
      fireEvent.click(await ready(remove));
      expect((await ready(add)).getAttribute("aria-pressed")).toBe("false");
      await waitFor(() =>
        expect(favoriteRouter.refresh).toHaveBeenCalledTimes(2),
      );
      expect(client.getQueryData(["catalog", "sentinel"])).toEqual({
        keep: true,
      });
      expect(client.getQueryState(["catalog", "sentinel"])?.isInvalidated).toBe(
        false,
      );
    },
  );

  it("shares pending state and prevents duplicate writes across two cards for the same model", async () => {
    const write = deferredFavorite<void>();
    mocks.request.mockImplementation(async (request, signal) => {
      if (request.action !== "select") await write.promise;
      return executeFavoriteRequest(request, signal);
    });
    renderButtons(
      <>
        <FavoriteModelButton modelId={fixture.modelId} />
        <FavoriteModelButton modelId={fixture.modelId} />
      </>,
    );
    const buttons = await screen.findAllByRole("button", {
      name: "Add to favorites",
    });
    await waitFor(() =>
      buttons.forEach((button) =>
        expect(button).toHaveProperty("disabled", false),
      ),
    );
    act(() => {
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[1]);
    });
    await waitFor(() =>
      expect(
        mocks.request.mock.calls.filter(
          ([request]) => request.action === "upsert",
        ),
      ).toHaveLength(1),
    );
    await waitFor(() =>
      buttons.forEach((button) =>
        expect(button).toHaveProperty("disabled", true),
      ),
    );
    await act(async () => write.resolve());
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Remove from favorites" }),
      ).toHaveLength(2),
    );
    await waitFor(() =>
      expect(favoriteRouter.refresh).toHaveBeenCalledTimes(1),
    );
  });

  it("does not change selection before a write is confirmed", async () => {
    const write = deferredFavorite<void>();
    mocks.request.mockImplementation(async (request, signal) => {
      if (request.action !== "select") await write.promise;
      return executeFavoriteRequest(request, signal);
    });
    renderButtons(<FavoriteModelButton modelId={fixture.modelId} />);
    fireEvent.click(await ready("Add to favorites"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Add to favorites" }),
      ).toHaveProperty("disabled", true),
    );
    expect(
      screen
        .getByRole("button", { name: "Add to favorites" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
    await act(async () => write.resolve());
    await ready("Remove from favorites");
  });

  it.each(["en", "ua"] as const)(
    "shows translated write errors in %s and reconciles without inventing a successful save",
    async (locale) => {
      const messages = locale === "ua" ? ua : en;
      renderButtons(<FavoriteModelButton modelId={fixture.modelId} />, locale);
      const add = messages.Catalog.resultsArea.modelCard.favoriteButton;
      const button = await ready(add);
      mocks.request.mockResolvedValueOnce(favoriteDatabaseFailure());
      fireEvent.click(button);
      expect(
        await screen.findByText(messages.Favorites.errors.generic),
      ).toBeTruthy();
      expect((await ready(add)).getAttribute("aria-pressed")).toBe("false");
      expect(state.models.get(fixture.user.id) ?? []).toEqual([]);
      expect(screen.queryByText(/private database/)).toBeNull();
      fireEvent.click(await ready(add));
      await ready(messages.Catalog.resultsArea.modelCard.removeFavoriteButton);
    },
  );

  it.each(["model", "designer"] as const)(
    "makes a failed %s read retryable without showing a fake unselected state",
    async (kind) => {
      mocks.request.mockResolvedValueOnce(favoriteDatabaseFailure());
      renderButtons(
        kind === "model" ? (
          <FavoriteModelButton modelId={fixture.modelId} />
        ) : (
          <FollowDesignerButton designerId={fixture.designerId} />
        ),
      );
      const retry =
        kind === "model" ? en.Favorites.retryModel : en.Favorites.retryDesigner;
      const button = await ready(retry);
      expect(button.getAttribute("aria-pressed")).toBeNull();
      expect(button.getAttribute("title")).toBe(en.Favorites.errors.generic);
      expect(
        screen.queryByRole("button", {
          name: kind === "model" ? "Add to favorites" : "Follow designer",
        }),
      ).toBeNull();
      fireEvent.click(button);
      await ready(kind === "model" ? "Add to favorites" : "Follow designer");
      expect(
        mocks.request.mock.calls.every(
          ([request]) => request.action === "select",
        ),
      ).toBe(true);
    },
  );

  it("recovers from an Auth outage instead of treating it as a confirmed guest", async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { status: 500, message: "private auth" },
    });
    renderButtons(<FavoriteModelButton modelId={fixture.modelId} />);
    fireEvent.click(await ready(en.Favorites.retryModel));
    await ready("Add to favorites");
    expect(
      mocks.request.mock.calls.every(
        ([request]) => request.action === "select",
      ),
    ).toBe(true);
  });

  it("reports repeated read failure through the actual toast UI", async () => {
    mocks.request
      .mockResolvedValueOnce(favoriteDatabaseFailure())
      .mockResolvedValueOnce(favoriteDatabaseFailure());
    renderButtons(<FavoriteModelButton modelId={fixture.modelId} />);
    fireEvent.click(await ready(en.Favorites.retryModel));
    expect(await screen.findByText(en.Favorites.errors.generic)).toBeTruthy();
    await ready(en.Favorites.retryModel);
    expect(
      mocks.request.mock.calls.every(
        ([request]) => request.action === "select",
      ),
    ).toBe(true);
  });

  it("checks live identity before writing and then reloads the current account", async () => {
    renderButtons(<FavoriteModelButton modelId={fixture.modelId} />);
    const button = await ready("Add to favorites");
    state.user = fixture.otherUser;
    fireEvent.click(button);
    expect(
      await screen.findByText(en.Favorites.errors.sessionChanged),
    ).toBeTruthy();
    await waitFor(() =>
      expect(client.getQueryData(favoritesQueryKeys.currentUser())).toBe(
        fixture.otherUser.id,
      ),
    );
    expect(
      mocks.request.mock.calls.every(
        ([request]) => request.action === "select",
      ),
    ).toBe(true);
  });

  it("rechecks Auth when a private read discovers a changed account", async () => {
    renderButtons(<FavoriteModelButton modelId={fixture.modelId} />);
    await ready("Add to favorites");
    state.user = fixture.otherUser;
    await act(async () =>
      client.invalidateQueries({
        queryKey: favoritesQueryKeys.modelFavorites(fixture.user.id),
        exact: true,
      }),
    );
    fireEvent.click(await ready(en.Favorites.retryModel));
    await ready("Add to favorites");
    expect(client.getQueryData(favoritesQueryKeys.currentUser())).toBe(
      fixture.otherUser.id,
    );
    expect(
      mocks.request.mock.calls.every(
        ([request]) => request.action === "select",
      ),
    ).toBe(true);
  });

  it("reports a removed target and allows another attempt", async () => {
    renderButtons(<FollowDesignerButton designerId={fixture.designerId} />);
    const button = await ready("Follow designer");
    mocks.request.mockResolvedValueOnce(favoriteDatabaseFailure("23503", 409));
    fireEvent.click(button);
    expect(
      await screen.findByText(en.Favorites.errors.unavailable),
    ).toBeTruthy();
    await ready("Follow designer");
  });

  it("blocks the surrounding card navigation for both save and read-retry clicks", async () => {
    const parent = vi.fn();
    mocks.request.mockResolvedValueOnce(favoriteDatabaseFailure());
    renderButtons(
      <div onClick={parent}>
        <FavoriteModelButton modelId={fixture.modelId} />
      </div>,
    );
    fireEvent.click(await ready(en.Favorites.retryModel));
    fireEvent.click(await ready("Add to favorites"));
    await ready("Remove from favorites");
    expect(parent).not.toHaveBeenCalled();
  });

  it("shows a timeout without claiming that the server definitely rejected the write", async () => {
    renderButtons(<FavoriteModelButton modelId={fixture.modelId} />);
    const button = await ready("Add to favorites");
    mocks.request.mockReturnValueOnce(new Promise<never>(() => {}));
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(button);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(
      mocks.request.mock.calls.some(([request]) => request.action === "upsert"),
    ).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByText(en.Favorites.errors.timeout)).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Add to favorites" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });
});
