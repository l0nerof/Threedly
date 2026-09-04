import { fetchProfileLibraryData } from "@/src/app/[locale]/(main-pages)/profile/library/actions";
import { vi } from "vitest";
import { beforeEach, describe, expect, it } from "../fixtures";

const mocks = vi.hoisted(() => ({
  downloadedEqMock: vi.fn(),
  downloadedLimitMock: vi.fn(),
  downloadedOrderMock: vi.fn(),
  downloadedSelectMock: vi.fn(),
  favoriteEqMock: vi.fn(),
  favoriteLimitMock: vi.fn(),
  favoriteOrderMock: vi.fn(),
  favoriteSelectMock: vi.fn(),
  followEqMock: vi.fn(),
  followLimitMock: vi.fn(),
  followOrderMock: vi.fn(),
  followSelectMock: vi.fn(),
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
  modelCountEqMock: vi.fn(),
  modelCountInMock: vi.fn(),
  modelCountSelectMock: vi.fn(),
}));

vi.mock("@/src/business/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUserMock,
    },
    from: mocks.fromMock,
  })),
}));

type QueryRows = {
  data: unknown[];
  error: null;
};

function createListQuery({
  eqMock,
  limitMock,
  orderMock,
  rows,
}: {
  eqMock: typeof mocks.downloadedEqMock;
  limitMock: typeof mocks.downloadedLimitMock;
  orderMock: typeof mocks.downloadedOrderMock;
  rows: unknown[];
}) {
  const result: QueryRows = {
    data: rows,
    error: null,
  };
  const query = {
    eq: eqMock,
    limit: limitMock,
    order: orderMock,
  };

  eqMock.mockReturnValue(query);
  orderMock.mockReturnValue(query);
  limitMock.mockResolvedValue(result);

  return query;
}

function createModelCountQuery(rows: { creator_id: string | null }[]) {
  const query = {
    eq: mocks.modelCountEqMock,
    in: mocks.modelCountInMock,
  };

  mocks.modelCountInMock.mockReturnValue(query);
  mocks.modelCountEqMock.mockResolvedValue({
    data: rows,
    error: null,
  });

  return query;
}

const modelRow = {
  cover_image_path: "designer-1/cloud-sofa/cover.webp",
  description_en: null,
  description_ua: null,
  download_count: 87,
  file_format: "fbx",
  id: "model-1",
  is_featured: true,
  minimum_plan: "max",
  published_at: "2026-05-01T10:00:00.000Z",
  slug: "cloud-sofa",
  title_en: "Cloud Sofa",
  title_ua: "Cloud Sofa",
};

describe("profile library action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  });

  it("returns null for guests", async () => {
    mocks.getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await fetchProfileLibraryData();

    expect(result).toBeNull();
    expect(mocks.fromMock).not.toHaveBeenCalled();
  });

  it("loads downloaded models, favorite models, and followed designers", async () => {
    mocks.getUserMock.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const downloadedQuery = createListQuery({
      eqMock: mocks.downloadedEqMock,
      limitMock: mocks.downloadedLimitMock,
      orderMock: mocks.downloadedOrderMock,
      rows: [{ model: modelRow }],
    });
    const favoriteQuery = createListQuery({
      eqMock: mocks.favoriteEqMock,
      limitMock: mocks.favoriteLimitMock,
      orderMock: mocks.favoriteOrderMock,
      rows: [
        {
          model: {
            ...modelRow,
            cover_image_path: "/demo/favorite-cover.webp",
            id: "model-2",
            slug: "linen-chair",
          },
        },
      ],
    });
    const followQuery = createListQuery({
      eqMock: mocks.followEqMock,
      limitMock: mocks.followLimitMock,
      orderMock: mocks.followOrderMock,
      rows: [
        {
          designer: {
            avatar_path: "designer-1/avatar.webp",
            bio: "Interior assets.",
            created_at: "2026-01-15T10:00:00.000Z",
            id: "designer-1",
            plan_key: "pro",
            username: "demo_studio",
          },
        },
      ],
    });
    const modelCountQuery = createModelCountQuery([
      { creator_id: "designer-1" },
      { creator_id: "designer-1" },
    ]);

    mocks.downloadedSelectMock.mockReturnValue(downloadedQuery);
    mocks.favoriteSelectMock.mockReturnValue(favoriteQuery);
    mocks.followSelectMock.mockReturnValue(followQuery);
    mocks.modelCountSelectMock.mockReturnValue(modelCountQuery);
    mocks.fromMock.mockImplementation((table: string) => {
      if (table === "downloads") {
        return { select: mocks.downloadedSelectMock };
      }

      if (table === "favorites") {
        return { select: mocks.favoriteSelectMock };
      }

      if (table === "designer_follows") {
        return { select: mocks.followSelectMock };
      }

      if (table === "models") {
        return { select: mocks.modelCountSelectMock };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await fetchProfileLibraryData();

    expect(result?.downloadedModels).toHaveLength(1);
    expect(result?.favoriteModels).toHaveLength(1);
    expect(result?.followedDesigners).toEqual([
      expect.objectContaining({
        avatar_path:
          "https://example.supabase.co/storage/v1/object/public/avatars/designer-1/avatar.webp",
        id: "designer-1",
        model_count: 2,
        username: "demo_studio",
      }),
    ]);
    expect(result?.downloadedModels[0]?.cover_image_path).toBe(
      "https://example.supabase.co/storage/v1/object/public/model-images/designer-1/cloud-sofa/cover.webp",
    );
    expect(result?.favoriteModels[0]?.cover_image_path).toBe(
      "/demo/favorite-cover.webp",
    );
    expect(mocks.downloadedEqMock).toHaveBeenCalledWith("user_id", "user-1");
    expect(mocks.favoriteEqMock).toHaveBeenCalledWith("user_id", "user-1");
    expect(mocks.followEqMock).toHaveBeenCalledWith("follower_id", "user-1");
    expect(mocks.modelCountInMock).toHaveBeenCalledWith("creator_id", [
      "designer-1",
    ]);
    expect(mocks.modelCountEqMock).toHaveBeenCalledWith("status", "published");
  });
});
