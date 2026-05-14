import {
  fetchDesignerProfileByUsername,
  fetchDesigners,
} from "@/src/app/[locale]/(main-pages)/designers/actions";
import { DESIGNER_PROFILE_MODELS_LIMIT } from "@/src/business/constants/designersConfig";
import { vi } from "vitest";
import { beforeEach, describe, expect, it } from "../fixtures";

const mocks = vi.hoisted(() => ({
  fromMock: vi.fn(),
  profileSelectMock: vi.fn(),
  profileEqMock: vi.fn(),
  profileOrderMock: vi.fn(),
  profileRangeMock: vi.fn(),
  profileMaybeSingleMock: vi.fn(),
  modelSelectMock: vi.fn(),
  modelEqMock: vi.fn(),
  modelInMock: vi.fn(),
  modelOrderMock: vi.fn(),
  modelLimitMock: vi.fn(),
}));

vi.mock("@/src/business/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mocks.fromMock,
  })),
}));

type ProfileRow = {
  id: string;
  username: string;
  bio: string | null;
  avatar_path: string | null;
  plan_key: "free" | "pro" | "max";
  created_at: string;
};

type ModelRow = {
  id: string;
  slug: string;
  title_ua: string;
  title_en: string;
  description_ua: string | null;
  description_en: string | null;
  cover_image_path: string;
  minimum_plan: "free" | "pro" | "max";
  file_format: string | null;
  download_count: number;
  is_featured: boolean;
  published_at: string | null;
};

function createProfileQuery(profile: ProfileRow | null) {
  const query = {
    eq: mocks.profileEqMock,
    maybeSingle: mocks.profileMaybeSingleMock,
  };

  mocks.profileEqMock.mockReturnValue(query);
  mocks.profileMaybeSingleMock.mockResolvedValue({
    data: profile,
    error: null,
  });

  return query;
}

function createDesignersListQuery(profiles: ProfileRow[], count: number) {
  const query = {
    eq: mocks.profileEqMock,
    order: mocks.profileOrderMock,
    range: mocks.profileRangeMock,
  };

  mocks.profileEqMock.mockReturnValue(query);
  mocks.profileOrderMock.mockReturnValue(query);
  mocks.profileRangeMock.mockResolvedValue({
    data: profiles,
    count,
    error: null,
  });

  return query;
}

function createModelsQuery(models: ModelRow[], count: number) {
  const query = {
    eq: mocks.modelEqMock,
    order: mocks.modelOrderMock,
    limit: mocks.modelLimitMock,
  };

  mocks.modelEqMock.mockReturnValue(query);
  mocks.modelOrderMock.mockReturnValue(query);
  mocks.modelLimitMock.mockResolvedValue({
    data: models,
    count,
    error: null,
  });

  return query;
}

function createModelCreatorRowsQuery(rows: { creator_id: string | null }[]) {
  const query = {
    eq: mocks.modelEqMock,
    in: mocks.modelInMock,
  };

  mocks.modelInMock.mockReturnValue(query);
  mocks.modelEqMock.mockResolvedValue({
    data: rows,
    error: null,
  });

  return query;
}

describe("designers actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  });

  it("loads designers with their published model counts", async () => {
    const profiles: ProfileRow[] = [
      {
        id: "profile-1",
        username: "olena_kovalenko",
        bio: "Interior designer.",
        avatar_path: null,
        plan_key: "pro",
        created_at: "2026-01-15T10:00:00.000Z",
      },
      {
        id: "profile-2",
        username: "volodymyr_hrytsenko",
        bio: "Generalist 3D artist.",
        avatar_path: null,
        plan_key: "max",
        created_at: "2026-02-15T10:00:00.000Z",
      },
    ];

    const profileQuery = createDesignersListQuery(profiles, profiles.length);
    const modelCountsQuery = createModelCreatorRowsQuery([
      { creator_id: "profile-1" },
      { creator_id: "profile-1" },
      { creator_id: "profile-2" },
    ]);

    mocks.profileSelectMock.mockReturnValue(profileQuery);
    mocks.modelSelectMock.mockReturnValue(modelCountsQuery);
    mocks.fromMock.mockImplementation((table: string) => {
      if (table === "profiles") {
        return { select: mocks.profileSelectMock };
      }

      if (table === "models") {
        return { select: mocks.modelSelectMock };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await fetchDesigners({ page: 1 });

    expect(result.designers).toEqual([
      expect.objectContaining({
        id: "profile-1",
        username: "olena_kovalenko",
        model_count: 2,
      }),
      expect.objectContaining({
        id: "profile-2",
        username: "volodymyr_hrytsenko",
        model_count: 1,
      }),
    ]);
    expect(result.totalCount).toBe(2);
    expect(mocks.modelSelectMock).toHaveBeenCalledWith("creator_id");
    expect(mocks.modelInMock).toHaveBeenCalledWith("creator_id", [
      "profile-1",
      "profile-2",
    ]);
    expect(mocks.modelEqMock).toHaveBeenCalledWith("status", "published");
  });

  it("loads a public designer profile with published models", async () => {
    const profileQuery = createProfileQuery({
      id: "profile-1",
      username: "demo_studio",
      bio: "Interior assets for quiet commercial scenes.",
      avatar_path: "profile-1/avatar",
      plan_key: "pro",
      created_at: "2026-01-15T10:00:00.000Z",
    });
    const modelsQuery = createModelsQuery(
      [
        {
          id: "model-1",
          slug: "linen-sofa",
          title_ua: "Лляний диван",
          title_en: "Linen sofa",
          description_ua: null,
          description_en: null,
          cover_image_path: "profile-1/model-1/cover.jpg",
          minimum_plan: "free",
          file_format: "glb",
          download_count: 12,
          is_featured: true,
          published_at: "2026-03-10T10:00:00.000Z",
        },
        {
          id: "model-2",
          slug: "soft-armchair",
          title_ua: "М'яке крісло",
          title_en: "Soft armchair",
          description_ua: null,
          description_en: null,
          cover_image_path: "profile-1/model-2/cover.jpg",
          minimum_plan: "pro",
          file_format: "fbx",
          download_count: 7,
          is_featured: false,
          published_at: "2026-02-01T10:00:00.000Z",
        },
      ],
      2,
    );

    mocks.profileSelectMock.mockReturnValue(profileQuery);
    mocks.modelSelectMock.mockReturnValue(modelsQuery);
    mocks.fromMock.mockImplementation((table: string) => {
      if (table === "profiles") {
        return { select: mocks.profileSelectMock };
      }

      if (table === "models") {
        return { select: mocks.modelSelectMock };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await fetchDesignerProfileByUsername("demo_studio");

    expect(result?.designer).toMatchObject({
      id: "profile-1",
      username: "demo_studio",
      bio: "Interior assets for quiet commercial scenes.",
      avatar_path:
        "https://example.supabase.co/storage/v1/object/public/avatars/profile-1/avatar",
      plan_key: "pro",
      model_count: 2,
    });
    expect(result?.models).toHaveLength(2);
    expect(result?.models[0]?.cover_image_path).toBe(
      "https://example.supabase.co/storage/v1/object/public/model-images/profile-1/model-1/cover.jpg",
    );
    expect(result).not.toHaveProperty("totalDownloads");
    expect(mocks.profileSelectMock).toHaveBeenCalledWith(
      "id, username, bio, avatar_path, plan_key, created_at",
    );
    expect(mocks.profileEqMock).toHaveBeenNthCalledWith(
      1,
      "username",
      "demo_studio",
    );
    expect(mocks.profileEqMock).toHaveBeenNthCalledWith(2, "can_upload", true);
    expect(mocks.modelSelectMock).toHaveBeenCalledWith(
      "id, slug, title_ua, title_en, description_ua, description_en, cover_image_path, minimum_plan, file_format, download_count, is_featured, published_at",
      { count: "exact" },
    );
    expect(mocks.modelEqMock).toHaveBeenNthCalledWith(
      1,
      "creator_id",
      "profile-1",
    );
    expect(mocks.modelEqMock).toHaveBeenNthCalledWith(2, "status", "published");
    expect(mocks.modelOrderMock).toHaveBeenCalledWith("published_at", {
      ascending: false,
    });
    expect(mocks.modelLimitMock).toHaveBeenCalledWith(
      DESIGNER_PROFILE_MODELS_LIMIT,
    );
  });

  it("returns null when the username does not belong to an upload-enabled designer", async () => {
    const profileQuery = createProfileQuery(null);

    mocks.profileSelectMock.mockReturnValue(profileQuery);
    mocks.fromMock.mockImplementation((table: string) => {
      if (table === "profiles") {
        return { select: mocks.profileSelectMock };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await fetchDesignerProfileByUsername("missing_creator");

    expect(result).toBeNull();
    expect(mocks.modelSelectMock).not.toHaveBeenCalled();
  });
});
