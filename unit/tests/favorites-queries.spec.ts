import {
  fetchCurrentUserId,
  fetchFavoriteModelIds,
  fetchFollowedDesignerIds,
  setDesignerFollow,
  setModelFavorite,
} from "@/src/business/queries/favorites";
import { vi } from "vitest";
import { beforeEach, describe, expect, it } from "../fixtures";

const mocks = vi.hoisted(() => ({
  deleteDesignerEqMock: vi.fn(),
  deleteModelEqMock: vi.fn(),
  deleteUserEqMock: vi.fn(),
  deleteMock: vi.fn(),
  eqMock: vi.fn(),
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
  insertMock: vi.fn(),
  selectMock: vi.fn(),
}));

vi.mock("@/src/business/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mocks.getUserMock,
    },
    from: mocks.fromMock,
  }),
}));

function mockSelectRows(rows: unknown[]) {
  mocks.selectMock.mockReturnValue({ eq: mocks.eqMock });
  mocks.eqMock.mockResolvedValue({
    data: rows,
    error: null,
  });
}

function mockDeleteChain() {
  mocks.deleteMock.mockReturnValue({ eq: mocks.deleteUserEqMock });
  mocks.deleteUserEqMock.mockReturnValue({ eq: mocks.deleteModelEqMock });
  mocks.deleteModelEqMock.mockResolvedValue({ error: null });
}

describe("favorites queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fromMock.mockReturnValue({
      delete: mocks.deleteMock,
      insert: mocks.insertMock,
      select: mocks.selectMock,
    });
    mocks.insertMock.mockResolvedValue({ error: null });
    mockDeleteChain();
  });

  it("returns null when there is no authenticated user", async () => {
    mocks.getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(fetchCurrentUserId()).resolves.toBeNull();
  });

  it("loads favorite model ids for the current profile", async () => {
    mockSelectRows([{ model_id: "model-1" }, { model_id: "model-2" }]);

    await expect(fetchFavoriteModelIds("user-1")).resolves.toEqual([
      "model-1",
      "model-2",
    ]);
    expect(mocks.fromMock).toHaveBeenCalledWith("favorites");
    expect(mocks.selectMock).toHaveBeenCalledWith("model_id");
    expect(mocks.eqMock).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("loads followed designer ids for the current profile", async () => {
    mockSelectRows([
      { designer_id: "designer-1" },
      { designer_id: "designer-2" },
    ]);

    await expect(fetchFollowedDesignerIds("user-1")).resolves.toEqual([
      "designer-1",
      "designer-2",
    ]);
    expect(mocks.fromMock).toHaveBeenCalledWith("designer_follows");
    expect(mocks.selectMock).toHaveBeenCalledWith("designer_id");
    expect(mocks.eqMock).toHaveBeenCalledWith("follower_id", "user-1");
  });

  it("inserts and deletes model favorites", async () => {
    await setModelFavorite({
      isFavorite: true,
      modelId: "model-1",
      userId: "user-1",
    });
    expect(mocks.fromMock).toHaveBeenCalledWith("favorites");
    expect(mocks.insertMock).toHaveBeenCalledWith({
      model_id: "model-1",
      user_id: "user-1",
    });

    await setModelFavorite({
      isFavorite: false,
      modelId: "model-1",
      userId: "user-1",
    });
    expect(mocks.deleteUserEqMock).toHaveBeenCalledWith("user_id", "user-1");
    expect(mocks.deleteModelEqMock).toHaveBeenCalledWith("model_id", "model-1");
  });

  it("inserts and deletes designer follows", async () => {
    await setDesignerFollow({
      designerId: "designer-1",
      isFollowing: true,
      userId: "user-1",
    });
    expect(mocks.fromMock).toHaveBeenCalledWith("designer_follows");
    expect(mocks.insertMock).toHaveBeenCalledWith({
      designer_id: "designer-1",
      follower_id: "user-1",
    });

    mocks.deleteUserEqMock.mockReturnValue({ eq: mocks.deleteDesignerEqMock });
    mocks.deleteDesignerEqMock.mockResolvedValue({ error: null });

    await setDesignerFollow({
      designerId: "designer-1",
      isFollowing: false,
      userId: "user-1",
    });
    expect(mocks.deleteUserEqMock).toHaveBeenCalledWith(
      "follower_id",
      "user-1",
    );
    expect(mocks.deleteDesignerEqMock).toHaveBeenCalledWith(
      "designer_id",
      "designer-1",
    );
  });
});
