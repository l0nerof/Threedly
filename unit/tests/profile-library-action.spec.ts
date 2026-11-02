import { fetchProfileLibraryData } from "@/src/app/[locale]/(main-pages)/profile/library/actions";
import { vi } from "vitest";
import { afterEach, beforeEach, describe, expect, it } from "../fixtures";
import {
  createLibraryFixture,
  createLibraryModel,
  libraryDesigner,
  libraryUser,
  libraryMocks as mocks,
  resetLibraryMocks,
} from "../mocks/profile-library";

vi.mock("@/src/business/utils/supabase/server", async () => {
  const { libraryMocks } = await import("../mocks/profile-library");
  return { createClient: libraryMocks.createClient };
});
vi.mock("next/navigation", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/navigation")>();
  const { createLibraryNavigationMock } =
    await import("../mocks/profile-library");
  return { ...original, ...createLibraryNavigationMock() };
});

beforeEach(() => {
  resetLibraryMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://library.example.test");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("profile library action", () => {
  it("returns one validated page with full counts using the session-bound RPC", async () => {
    expect(await fetchProfileLibraryData()).toEqual({
      ok: true,
      library: createLibraryFixture(),
    });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith(
      "get_profile_library_page",
      { requested_tab: "downloaded", requested_page: 1 },
    );
    expect(mocks.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it("passes the chosen tab and page, keeping the clamped last page", async () => {
    const library = createLibraryFixture({
      active_tab: "favoriteModels",
      current_page: 2,
      total_pages: 2,
      models: [createLibraryModel(25), createLibraryModel(26)],
    });
    mocks.maybeSingle.mockResolvedValueOnce({ data: library, error: null });
    expect(
      await fetchProfileLibraryData({ tab: "favoriteModels", page: "999" }),
    ).toEqual({ ok: true, library });
    expect(mocks.rpc).toHaveBeenCalledWith("get_profile_library_page", {
      requested_tab: "favoriteModels",
      requested_page: 999,
    });
  });

  it("resolves covers and strips unexpected private model and wrapper fields", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: {
        ...createLibraryFixture(),
        email: "private@example.test",
        models: [
          {
            ...createLibraryModel(),
            cover_image_path: "creator/cover.webp",
            preview_model_path: "private.glb",
            creator: { email: "private@example.test" },
          },
        ],
      },
      error: null,
    });
    const result = await fetchProfileLibraryData();
    expect(result).toEqual({
      ok: true,
      library: createLibraryFixture({
        models: [
          {
            ...createLibraryModel(),
            cover_image_path:
              "https://library.example.test/storage/v1/object/public/model-images/creator/cover.webp",
          },
        ],
      }),
    });
  });

  it("validates designers, preserves full portfolio counts and resolves avatars", async () => {
    const designer = {
      ...libraryDesigner,
      avatar_path: "creator/avatar.webp",
      can_upload: true,
    };
    mocks.maybeSingle.mockResolvedValueOnce({
      data: createLibraryFixture({
        active_tab: "subscriptions",
        followed_count: 1,
        models: [],
        designers: [designer],
      }),
      error: null,
    });
    const result = await fetchProfileLibraryData({ tab: "subscriptions" });
    expect(result).toEqual({
      ok: true,
      library: createLibraryFixture({
        active_tab: "subscriptions",
        followed_count: 1,
        models: [],
        designers: [
          {
            ...libraryDesigner,
            avatar_path:
              "https://library.example.test/storage/v1/object/public/avatars/creator/avatar.webp",
          },
        ],
      }),
    });
  });

  it.each([
    "0",
    "-1",
    "1.5",
    "abc",
    "Infinity",
    "2147483648",
    "",
    ["2"],
    undefined,
  ])("normalizes an invalid page %j to page one", async (page) => {
    await fetchProfileLibraryData({ page, tab: "invalid" });
    expect(mocks.rpc).toHaveBeenCalledWith("get_profile_library_page", {
      requested_tab: "downloaded",
      requested_page: 1,
    });
  });

  it.each([null, [], "invalid", 4])(
    "rejects a malformed input object %j",
    async (input) => {
      expect(await fetchProfileLibraryData(input)).toEqual({
        ok: false,
        error: "generic",
      });
      expect(mocks.createClient).not.toHaveBeenCalled();
    },
  );

  it("returns unauthorized for guests before querying any library data", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    expect(await fetchProfileLibraryData()).toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each([400, 401, 403, 500])(
    "separates auth failure status %s from service failures",
    async (status) => {
      mocks.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { status, message: "private detail" },
      });
      expect(await fetchProfileLibraryData()).toEqual({
        ok: false,
        error: status === 500 ? "generic" : "unauthorized",
      });
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );

  it.each([
    null,
    { ...createLibraryFixture(), profile_id: libraryDesigner.id },
    { ...createLibraryFixture(), active_tab: "favoriteModels" },
    { ...createLibraryFixture(), downloaded_count: -1 },
    {
      ...createLibraryFixture(),
      downloaded_count: Number.MAX_SAFE_INTEGER + 1,
    },
    { ...createLibraryFixture(), downloaded_count: 1.5 },
    { ...createLibraryFixture(), total_pages: 2 },
    { ...createLibraryFixture(), current_page: 2 },
    { ...createLibraryFixture(), models: [] },
    { ...createLibraryFixture(), designers: [libraryDesigner] },
    {
      ...createLibraryFixture(),
      models: [{ ...createLibraryModel(), id: "invalid" }],
    },
    {
      ...createLibraryFixture(),
      models: [{ ...createLibraryModel(), minimum_plan: "invented" }],
    },
    {
      ...createLibraryFixture(),
      models: [{ ...createLibraryModel(), published_at: "yesterday" }],
    },
    {
      ...createLibraryFixture(),
      downloaded_count: 2,
      models: [createLibraryModel(), createLibraryModel()],
    },
    {
      ...createLibraryFixture(),
      downloaded_count: 25,
      total_pages: 2,
      models: Array.from({ length: 25 }, (_, index) =>
        createLibraryModel(index),
      ),
    },
  ])(
    "rejects invalid, partial, duplicated or wrong-user responses %#",
    async (data) => {
      mocks.maybeSingle.mockResolvedValueOnce({ data, error: null });
      expect(await fetchProfileLibraryData()).toEqual({
        ok: false,
        error: "generic",
      });
    },
  );

  it("returns safe generic errors for database failures without exposing details", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "private SQL detail" },
    });
    expect(await fetchProfileLibraryData()).toEqual({
      ok: false,
      error: "generic",
    });
  });

  it("handles rejected requests", async () => {
    mocks.maybeSingle.mockRejectedValueOnce(new Error("private detail"));
    expect(await fetchProfileLibraryData()).toEqual({
      ok: false,
      error: "generic",
    });
  });

  it.each(["client", "auth", "rpc"])(
    "bounds a stalled %s request to ten seconds and clears its timer",
    async (stage) => {
      vi.useFakeTimers();
      const stalled = new Promise<never>(() => {});
      if (stage === "client") mocks.createClient.mockReturnValueOnce(stalled);
      else if (stage === "auth") mocks.getUser.mockReturnValueOnce(stalled);
      else mocks.maybeSingle.mockReturnValueOnce(stalled);
      const result = fetchProfileLibraryData();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await result).toEqual({ ok: false, error: "timeout" });
      expect(vi.getTimerCount()).toBe(0);
      if (stage === "rpc")
        expect(mocks.abortSignal.mock.calls[0][0].aborted).toBe(true);
    },
  );

  it("clears the timer after success", async () => {
    vi.useFakeTimers();
    await fetchProfileLibraryData();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("accepts a valid empty account without treating it as a read failure", async () => {
    const library = createLibraryFixture({
      downloaded_count: 0,
      favorite_count: 0,
      followed_count: 0,
      models: [],
    });
    mocks.maybeSingle.mockResolvedValueOnce({ data: library, error: null });
    expect(await fetchProfileLibraryData()).toEqual({ ok: true, library });
  });

  it("shares the same ten-second deadline across Auth and RPC", async () => {
    vi.useFakeTimers();
    mocks.getUser.mockReturnValueOnce(
      new Promise((resolve) => {
        setTimeout(
          () => resolve({ data: { user: libraryUser }, error: null }),
          9_000,
        );
      }),
    );
    mocks.maybeSingle.mockReturnValueOnce(new Promise<never>(() => {}));
    const result = fetchProfileLibraryData();
    await vi.advanceTimersByTimeAsync(9_000);
    expect(mocks.rpc).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(await result).toEqual({ ok: false, error: "timeout" });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects malformed designer metadata", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: {
        ...createLibraryFixture({
          active_tab: "subscriptions",
          followed_count: 1,
          models: [],
        }),
        designers: [{ ...libraryDesigner, model_count: -1 }],
      },
      error: null,
    });
    expect(await fetchProfileLibraryData({ tab: "subscriptions" })).toEqual({
      ok: false,
      error: "generic",
    });
  });

  it("preserves real Next.js redirect control flow", async () => {
    expect.assertions(1);
    const { redirect } =
      await vi.importActual<typeof import("next/navigation")>(
        "next/navigation",
      );
    mocks.createClient.mockImplementationOnce(() => redirect("/en/login"));
    await expect(fetchProfileLibraryData()).rejects.toThrow("NEXT_REDIRECT");
  });
});
