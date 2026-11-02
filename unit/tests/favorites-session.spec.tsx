import en from "@/messages/en.json";
import FavoriteModelButton from "@/src/business/components/FavoriteModelButton";
import FollowDesignerButton from "@/src/business/components/FollowDesignerButton";
import { QueryProvider } from "@/src/business/providers/QueryProvider";
import { favoritesQueryKeys } from "@/src/business/queries/favorites";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { useEffect } from "react";
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
  type FavoriteMockResponse,
  deferredFavorite,
  emitFavoriteAuth,
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
});
afterEach(() => {
  client?.clear();
  toast.dismiss();
  media.cleanup();
});

function Probe() {
  const queryClient = useQueryClient();
  useEffect(() => {
    client = queryClient;
  }, [queryClient]);
  return null;
}

function app() {
  return (
    <QueryProvider>
      <NextIntlClientProvider locale="en" messages={en}>
        <Probe />
        <FavoriteModelButton modelId={fixture.modelId} />
        <FollowDesignerButton designerId={fixture.designerId} />
        <Toaster />
      </NextIntlClientProvider>
    </QueryProvider>
  );
}

async function ready(name = "Add to favorites") {
  const button = await screen.findByRole("button", { name });
  await waitFor(() => expect(button).toHaveProperty("disabled", false));
  return button;
}

describe("favorite session synchronization", () => {
  it("registers one listener for all cards, ignores same-account token events and unsubscribes", async () => {
    const rendered = render(app());
    await ready();
    expect(mocks.onAuthStateChange).toHaveBeenCalledOnce();
    act(() => {
      emitFavoriteAuth("SIGNED_IN", fixture.user);
      emitFavoriteAuth("TOKEN_REFRESHED", fixture.user);
    });
    expect(favoriteRouter.refresh).not.toHaveBeenCalled();
    rendered.unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });

  it("switches accounts, clears the previous private lists and keeps public catalog data", async () => {
    state.models.set(fixture.user.id, [fixture.modelId]);
    state.designers.set(fixture.user.id, [fixture.designerId]);
    render(app());
    await ready("Remove from favorites");
    await ready("Unfollow designer");
    client.setQueryData(["catalog", "public"], { keep: true });
    act(() => emitFavoriteAuth("SIGNED_IN", fixture.otherUser));
    expect((await ready()).getAttribute("aria-pressed")).toBe("false");
    await ready("Follow designer");
    expect(
      client.getQueryData(favoritesQueryKeys.modelFavorites(fixture.user.id)),
    ).toBeUndefined();
    expect(
      client.getQueryData(
        favoritesQueryKeys.followedDesigners(fixture.user.id),
      ),
    ).toBeUndefined();
    expect(client.getQueryData(["catalog", "public"])).toEqual({ keep: true });
    expect(client.getQueryData(favoritesQueryKeys.currentUser())).toBe(
      fixture.otherUser.id,
    );
    await waitFor(() =>
      expect(favoriteRouter.refresh).toHaveBeenCalledTimes(1),
    );
  });

  it("clears private data and hides controls on sign-out", async () => {
    state.models.set(fixture.user.id, [fixture.modelId]);
    render(app());
    await ready("Remove from favorites");
    act(() => emitFavoriteAuth("SIGNED_OUT", null));
    await waitFor(() =>
      expect(screen.queryAllByRole("button")).toHaveLength(0),
    );
    expect(
      client.getQueryData(favoritesQueryKeys.modelFavorites(fixture.user.id)),
    ).toBeUndefined();
    expect(client.getQueryData(favoritesQueryKeys.currentUser())).toBeNull();
    await waitFor(() =>
      expect(favoriteRouter.refresh).toHaveBeenCalledTimes(1),
    );
  });

  it("does not let an old Auth response overwrite a new session", async () => {
    const auth = deferredFavorite<{
      data: { user: typeof fixture.user };
      error: null;
    }>();
    mocks.getUser.mockReturnValueOnce(auth.promise);
    render(app());
    await waitFor(() => expect(mocks.onAuthStateChange).toHaveBeenCalledOnce());
    act(() => emitFavoriteAuth("SIGNED_IN", fixture.otherUser));
    await ready();
    await act(async () =>
      auth.resolve({ data: { user: fixture.user }, error: null }),
    );
    expect(client.getQueryData(favoritesQueryKeys.currentUser())).toBe(
      fixture.otherUser.id,
    );
    expect(
      screen
        .getByRole("button", { name: "Add to favorites" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("cancels an old private read and ignores its late successful response", async () => {
    const read = deferredFavorite<FavoriteMockResponse>();
    mocks.request.mockImplementationOnce(() => read.promise);
    render(app());
    await waitFor(() => expect(mocks.request).toHaveBeenCalled());
    const oldSignal = mocks.request.mock.calls[0][1];
    act(() => emitFavoriteAuth("SIGNED_IN", fixture.otherUser));
    await ready();
    expect(oldSignal.aborted).toBe(true);
    await act(async () =>
      read.resolve({
        data: [{ model_id: fixture.modelId }],
        error: null,
        status: 200,
      }),
    );
    expect(
      client.getQueryData(favoritesQueryKeys.modelFavorites(fixture.user.id)),
    ).toBeUndefined();
    expect(
      screen
        .getByRole("button", { name: "Add to favorites" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it.each(["success", "failure"] as const)(
    "ignores a late mutation %s from the previous account",
    async (outcome) => {
      const write = deferredFavorite<FavoriteMockResponse>();
      mocks.request.mockImplementation((request, signal) =>
        request.action === "upsert"
          ? write.promise
          : executeFavoriteRequest(request, signal),
      );
      render(app());
      fireEvent.click(await ready());
      await waitFor(() =>
        expect(
          mocks.request.mock.calls.some(
            ([request]) => request.action === "upsert",
          ),
        ).toBe(true),
      );
      act(() => emitFavoriteAuth("SIGNED_IN", fixture.otherUser));
      await ready();
      await waitFor(() =>
        expect(favoriteRouter.refresh).toHaveBeenCalledTimes(1),
      );
      await act(async () =>
        write.resolve(
          outcome === "success"
            ? { data: null, error: null, status: 204 }
            : favoriteDatabaseFailure(),
        ),
      );
      expect(
        client.getQueryData(
          favoritesQueryKeys.modelFavorites(fixture.otherUser.id),
        ),
      ).toEqual([]);
      expect(
        client.getQueryData(favoritesQueryKeys.modelFavorites(fixture.user.id)),
      ).toBeUndefined();
      expect(screen.queryByText(en.Favorites.errors.generic)).toBeNull();
      expect(favoriteRouter.refresh).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["login", "logout"] as const)(
    "rechecks a server-action %s on navigation even without a browser auth event",
    async (operation) => {
      state.models.set(fixture.user.id, [fixture.modelId]);
      const rendered = render(app());
      await ready("Remove from favorites");
      state.user = operation === "login" ? fixture.otherUser : null;
      state.pathname =
        operation === "login" ? "/en/profile/library" : "/en/login";
      rendered.rerender(app());
      if (operation === "login") await ready();
      else
        await waitFor(() =>
          expect(
            client.getQueryData(favoritesQueryKeys.currentUser()),
          ).toBeNull(),
        );
      expect(client.getQueryData(favoritesQueryKeys.currentUser())).toBe(
        operation === "login" ? fixture.otherUser.id : null,
      );
      expect(
        client.getQueryData(favoritesQueryKeys.modelFavorites(fixture.user.id)),
      ).toBeUndefined();
      await waitFor(() =>
        expect(favoriteRouter.refresh).toHaveBeenCalledTimes(1),
      );
    },
  );

  it("does not call Auth from inside an auth-state callback", async () => {
    render(app());
    await ready();
    act(() => {
      const before = mocks.getUser.mock.calls.length;
      emitFavoriteAuth("SIGNED_IN", fixture.otherUser);
      expect(mocks.getUser.mock.calls.length).toBe(before);
    });
    await ready();
  });

  it("re-reads current data instead of applying an old mutation after switching away and back", async () => {
    const write = deferredFavorite<FavoriteMockResponse>();
    mocks.request.mockImplementation((request, signal) =>
      request.action === "upsert"
        ? write.promise
        : executeFavoriteRequest(request, signal),
    );
    render(app());
    fireEvent.click(await ready());
    await waitFor(() =>
      expect(
        mocks.request.mock.calls.some(
          ([request]) => request.action === "upsert",
        ),
      ).toBe(true),
    );
    act(() => emitFavoriteAuth("SIGNED_IN", fixture.otherUser));
    await ready();
    act(() => emitFavoriteAuth("SIGNED_IN", fixture.user));
    await waitFor(() =>
      expect(
        client.getQueryData(favoritesQueryKeys.modelFavorites(fixture.user.id)),
      ).toEqual([]),
    );
    const before = mocks.request.mock.calls.filter(
      ([request]) => request.action === "select",
    ).length;
    await act(async () =>
      write.resolve({ data: null, error: null, status: 204 }),
    );
    expect((await ready()).getAttribute("aria-pressed")).toBe("false");
    expect(
      mocks.request.mock.calls.filter(
        ([request]) => request.action === "select",
      ).length,
    ).toBeGreaterThan(before);
    expect(
      client.getQueryData(favoritesQueryKeys.modelFavorites(fixture.user.id)),
    ).toEqual([]);
  });
});
