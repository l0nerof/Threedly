import { FAVORITES_BATCH_SIZE } from "@/src/business/constants/favorites";
import {
  fetchCurrentUserId,
  fetchFavoriteModelIds,
  fetchFollowedDesignerIds,
  setDesignerFollow,
  setModelFavorite,
} from "@/src/business/queries/favorites";
import { vi } from "vitest";
import { afterEach, beforeEach, describe, expect, it } from "../fixtures";
import {
  type FavoriteMockResponse,
  deferredFavorite,
  favoriteDatabaseFailure,
  favoriteFixture as fixture,
  favoriteMocks as mocks,
  resetFavoriteMocks,
  favoriteMockState as state,
} from "../mocks/favorites";

vi.mock("@/src/business/utils/supabase/client", async () => {
  const { createFavoriteClientMock } = await import("../mocks/favorites");
  return { createClient: createFavoriteClientMock };
});

beforeEach(resetFavoriteMocks);
afterEach(() => vi.useRealTimers());

describe("favorites queries", () => {
  it("returns a validated user ID and accepts a guest without private queries", async () => {
    expect(await fetchCurrentUserId()).toBe(fixture.user.id);
    state.user = null;
    expect(await fetchCurrentUserId()).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it.each([400, 401, 403, 500])(
    "handles auth status %s without leaking its error",
    async (status) => {
      mocks.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { status, message: "private auth" },
      });
      if (status === 500)
        await expect(fetchCurrentUserId()).rejects.toMatchObject({
          code: "generic",
          message: "generic",
        });
      else expect(await fetchCurrentUserId()).toBeNull();
    },
  );

  it("rejects malformed auth data", async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: { user: { id: "invalid" } },
      error: null,
    });
    await expect(fetchCurrentUserId()).rejects.toMatchObject({
      code: "generic",
    });
  });

  it.each(["model", "designer"] as const)(
    "reads the complete ordered %s ID list, including more than 1000 records",
    async (kind) => {
      const ids = Array.from(
        { length: 1003 },
        (_, index) =>
          `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
      );
      (kind === "model" ? state.models : state.designers).set(
        fixture.user.id,
        ids,
      );
      const result = await (
        kind === "model" ? fetchFavoriteModelIds : fetchFollowedDesignerIds
      )(fixture.user.id);
      expect(result).toEqual(ids);
      expect(mocks.request).toHaveBeenCalledTimes(4);
      const requests = mocks.request.mock.calls.map(([request]) => request);
      expect(requests.map((request) => request.cursor)).toEqual([
        undefined,
        ids[499],
        ids[999],
        ids[1002],
      ]);
      expect(
        requests.every((request) => request.limit === FAVORITES_BATCH_SIZE),
      ).toBe(true);
      expect(requests[0].filters).toEqual(
        kind === "model"
          ? { user_id: fixture.user.id }
          : { follower_id: fixture.user.id },
      );
    },
  );

  it("continues after short nonempty pages rather than assuming the server row limit", async () => {
    mocks.request
      .mockResolvedValueOnce({
        data: [{ model_id: fixture.modelId }],
        error: null,
        status: 200,
      })
      .mockResolvedValueOnce({
        data: [{ model_id: fixture.designerId }],
        error: null,
        status: 200,
      });
    expect(await fetchFavoriteModelIds(fixture.user.id)).toEqual([
      fixture.modelId,
      fixture.designerId,
    ]);
    expect(mocks.request).toHaveBeenCalledTimes(3);
  });

  it.each([
    null,
    [{ model_id: "invalid" }],
    [{ designer_id: fixture.designerId }],
  ])(
    "rejects malformed model rows %j rather than returning a fake empty list",
    async (data) => {
      mocks.request.mockResolvedValueOnce({ data, error: null, status: 200 });
      await expect(
        fetchFavoriteModelIds(fixture.user.id),
      ).rejects.toMatchObject({ code: "generic" });
    },
  );

  it("rejects malformed designer rows", async () => {
    mocks.request.mockResolvedValueOnce({
      data: [{ designer_id: 1 }],
      error: null,
      status: 200,
    });
    await expect(
      fetchFollowedDesignerIds(fixture.user.id),
    ).rejects.toMatchObject({ code: "generic" });
  });

  it("rejects duplicate or backward IDs instead of looping or returning partial data", async () => {
    mocks.request.mockResolvedValueOnce({
      data: [{ model_id: fixture.modelId }, { model_id: fixture.modelId }],
      error: null,
      status: 200,
    });
    await expect(fetchFavoriteModelIds(fixture.user.id)).rejects.toMatchObject({
      code: "generic",
    });
  });

  it("does not return partial lists after a later page fails", async () => {
    mocks.request
      .mockResolvedValueOnce({
        data: [{ model_id: fixture.modelId }],
        error: null,
        status: 200,
      })
      .mockResolvedValueOnce(favoriteDatabaseFailure());
    await expect(fetchFavoriteModelIds(fixture.user.id)).rejects.toMatchObject({
      code: "generic",
      message: "generic",
    });
  });

  it.each(["read", "favorite", "follow"] as const)(
    "rejects a guest before %s private access",
    async (operation) => {
      state.user = null;
      const result =
        operation === "read"
          ? fetchFavoriteModelIds(fixture.user.id)
          : operation === "favorite"
            ? setModelFavorite({
                userId: fixture.user.id,
                modelId: fixture.modelId,
                isFavorite: true,
              })
            : setDesignerFollow({
                userId: fixture.user.id,
                designerId: fixture.designerId,
                isFollowing: true,
              });
      await expect(result).rejects.toMatchObject({ code: "unauthorized" });
      expect(mocks.from).not.toHaveBeenCalled();
    },
  );

  it("checks the live session rather than accepting a stale supplied owner", async () => {
    state.user = fixture.otherUser;
    await expect(
      setModelFavorite({
        userId: fixture.user.id,
        modelId: fixture.modelId,
        isFavorite: true,
      }),
    ).rejects.toMatchObject({ code: "sessionChanged" });
    await expect(
      fetchFollowedDesignerIds(fixture.user.id),
    ).rejects.toMatchObject({ code: "sessionChanged" });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("validates IDs and forbids self-follow before network access", async () => {
    await expect(fetchFavoriteModelIds("invalid")).rejects.toMatchObject({
      code: "invalidRequest",
    });
    await expect(
      setModelFavorite({
        userId: fixture.user.id,
        modelId: "invalid",
        isFavorite: true,
      }),
    ).rejects.toMatchObject({ code: "invalidRequest" });
    await expect(
      setDesignerFollow({
        userId: fixture.user.id,
        designerId: fixture.user.id,
        isFollowing: true,
      }),
    ).rejects.toMatchObject({ code: "invalidRequest" });
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it.each(["model", "designer"] as const)(
    "makes repeated add/remove %s intents idempotent and owner-scoped",
    async (kind) => {
      const store = kind === "model" ? state.models : state.designers;
      const targetId = kind === "model" ? fixture.modelId : fixture.designerId;
      const save = (selected: boolean) =>
        kind === "model"
          ? setModelFavorite({
              userId: fixture.user.id,
              modelId: targetId,
              isFavorite: selected,
            })
          : setDesignerFollow({
              userId: fixture.user.id,
              designerId: targetId,
              isFollowing: selected,
            });
      await save(true);
      await save(true);
      expect(store.get(fixture.user.id)).toEqual([targetId]);
      expect(mocks.request.mock.calls[0][0].conflict).toEqual({
        ignoreDuplicates: true,
        onConflict:
          kind === "model" ? "user_id,model_id" : "follower_id,designer_id",
      });
      await save(false);
      await save(false);
      expect(store.get(fixture.user.id)).toEqual([]);
      expect(mocks.request.mock.calls[2][0].filters).toEqual(
        kind === "model"
          ? { user_id: fixture.user.id, model_id: targetId }
          : { follower_id: fixture.user.id, designer_id: targetId },
      );
    },
  );

  it.each([
    ["23503", 409, "unavailable"],
    ["42501", 403, "unauthorized"],
    ["XX000", 500, "generic"],
  ] as const)(
    "maps database error %s to a safe code",
    async (code, status, expected) => {
      mocks.request.mockResolvedValueOnce(
        favoriteDatabaseFailure(code, status),
      );
      await expect(
        setModelFavorite({
          userId: fixture.user.id,
          modelId: fixture.modelId,
          isFavorite: true,
        }),
      ).rejects.toMatchObject({ code: expected, message: expected });
    },
  );

  it("handles a rejected request without exposing private text", async () => {
    mocks.request.mockRejectedValueOnce(new Error("private network detail"));
    await expect(fetchFavoriteModelIds(fixture.user.id)).rejects.toMatchObject({
      code: "generic",
      message: "generic",
    });
  });

  it.each(["auth", "read", "write"] as const)(
    "bounds a stalled %s to one ten-second deadline",
    async (stage) => {
      vi.useFakeTimers();
      if (stage === "auth")
        mocks.getUser.mockReturnValueOnce(new Promise<never>(() => {}));
      else mocks.request.mockReturnValueOnce(new Promise<never>(() => {}));
      const result =
        stage === "write"
          ? setModelFavorite({
              userId: fixture.user.id,
              modelId: fixture.modelId,
              isFavorite: true,
            })
          : fetchFavoriteModelIds(fixture.user.id);
      const assertion = expect(result).rejects.toMatchObject({
        code: "timeout",
      });
      await vi.advanceTimersByTimeAsync(10_000);
      await assertion;
      expect(vi.getTimerCount()).toBe(0);
      if (stage !== "auth")
        expect(mocks.request.mock.calls[0][1].aborted).toBe(true);
    },
  );

  it("does not start a write after a slow Auth request finishes beyond its deadline", async () => {
    vi.useFakeTimers();
    const auth = deferredFavorite<{
      data: { user: typeof fixture.user };
      error: null;
    }>();
    mocks.getUser.mockReturnValueOnce(auth.promise);
    const result = setModelFavorite({
      userId: fixture.user.id,
      modelId: fixture.modelId,
      isFavorite: true,
    });
    const assertion = expect(result).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    auth.resolve({ data: { user: fixture.user }, error: null });
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("cancels an in-flight list through the query AbortSignal", async () => {
    const pending = deferredFavorite<FavoriteMockResponse>();
    mocks.request.mockReturnValueOnce(pending.promise);
    const controller = new AbortController();
    const result = fetchFavoriteModelIds(fixture.user.id, controller.signal);
    const assertion = expect(result).rejects.toMatchObject({
      code: "sessionChanged",
    });
    await Promise.resolve();
    await Promise.resolve();
    controller.abort();
    await assertion;
    pending.resolve({ data: [], error: null, status: 200 });
  });

  it("rejects an oversized API page instead of accepting an unbounded response", async () => {
    mocks.request.mockResolvedValueOnce({
      data: Array.from({ length: FAVORITES_BATCH_SIZE + 1 }, (_, index) => ({
        model_id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
      })),
      error: null,
      status: 200,
    });
    await expect(fetchFavoriteModelIds(fixture.user.id)).rejects.toMatchObject({
      code: "generic",
    });
  });

  it.each(["read", "write"] as const)(
    "shares one deadline between slow Auth and the subsequent %s",
    async (operation) => {
      vi.useFakeTimers();
      mocks.getUser.mockReturnValueOnce(
        new Promise((resolve) => {
          setTimeout(
            () => resolve({ data: { user: fixture.user }, error: null }),
            9_000,
          );
        }),
      );
      mocks.request.mockReturnValueOnce(new Promise<never>(() => {}));
      const result =
        operation === "read"
          ? fetchFavoriteModelIds(fixture.user.id)
          : setModelFavorite({
              userId: fixture.user.id,
              modelId: fixture.modelId,
              isFavorite: true,
            });
      const assertion = expect(result).rejects.toMatchObject({
        code: "timeout",
      });
      await vi.advanceTimersByTimeAsync(9_000);
      expect(mocks.request).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(1_000);
      await assertion;
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("clears deadlines on success", async () => {
    vi.useFakeTimers();
    await fetchFavoriteModelIds(fixture.user.id);
    expect(vi.getTimerCount()).toBe(0);
  });
});
