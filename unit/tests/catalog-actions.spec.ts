import {
  fetchCatalogModelsCount,
  fetchModelBySlug,
} from "@/src/app/[locale]/(main-pages)/catalog/actions";
import { vi } from "vitest";
import { beforeEach, describe, expect, it } from "../fixtures";

const mocks = vi.hoisted(() => ({
  fromMock: vi.fn(),
  groupSelectMock: vi.fn(),
  groupInMock: vi.fn(),
  categorySelectMock: vi.fn(),
  categoryInMock: vi.fn(),
  modelSelectMock: vi.fn(),
  modelEqMock: vi.fn(),
  modelInMock: vi.fn(),
  modelSingleMock: vi.fn(),
}));

vi.mock("@/src/business/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mocks.fromMock,
  })),
}));

type CountResult = {
  count: number;
  error: null;
};

function createCountQuery() {
  const query: {
    eq: typeof mocks.modelEqMock;
    in: typeof mocks.modelInMock;
    then: Promise<CountResult>["then"];
  } = {
    eq: mocks.modelEqMock,
    in: mocks.modelInMock,
    then: (...args) =>
      Promise.resolve({ count: 12, error: null }).then(...args),
  };

  mocks.modelEqMock.mockReturnValue(query);
  mocks.modelInMock.mockReturnValue(query);

  return query;
}

describe("catalog actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

    const modelQuery = createCountQuery();

    mocks.modelSelectMock.mockReturnValue(modelQuery);
    mocks.groupSelectMock.mockReturnValue({
      in: mocks.groupInMock,
    });
    mocks.groupInMock.mockResolvedValue({
      data: [{ id: "group-furniture" }, { id: "group-decor" }],
      error: null,
    });
    mocks.categorySelectMock.mockReturnValue({
      in: mocks.categoryInMock,
    });
    mocks.categoryInMock.mockResolvedValue({
      data: [{ id: "category-chairs" }, { id: "category-sofas" }],
      error: null,
    });
    mocks.fromMock.mockImplementation((table: string) => {
      if (table === "models") {
        return { select: mocks.modelSelectMock };
      }

      if (table === "category_groups") {
        return { select: mocks.groupSelectMock };
      }

      if (table === "categories") {
        return { select: mocks.categorySelectMock };
      }

      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it("resolves category group slugs before filtering models by child categories", async () => {
    const count = await fetchCatalogModelsCount({
      groups: ["furniture", "decor"],
    });

    expect(count).toBe(12);
    expect(mocks.fromMock).toHaveBeenCalledWith("category_groups");
    expect(mocks.groupSelectMock).toHaveBeenCalledWith("id");
    expect(mocks.groupInMock).toHaveBeenCalledWith("slug", [
      "furniture",
      "decor",
    ]);
    expect(mocks.categorySelectMock).toHaveBeenCalledWith("id");
    expect(mocks.categoryInMock).toHaveBeenCalledWith("group_id", [
      "group-furniture",
      "group-decor",
    ]);
    expect(mocks.modelInMock).toHaveBeenCalledWith("category_id", [
      "category-chairs",
      "category-sofas",
    ]);
  });

  it("loads model detail data with the real creator profile", async () => {
    const modelRow = {
      cover_image_path: "user-1/model-1/cover.webp",
      creator: {
        avatar_path: "user-1/avatar.webp",
        username: "anna_kovalenko",
      },
      description_en: "Soft sofa for premium interiors.",
      description_ua: "М'який диван для преміальних інтер'єрів.",
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
    const modelQuery = {
      eq: mocks.modelEqMock,
      single: mocks.modelSingleMock,
    };

    mocks.modelSelectMock.mockReturnValue(modelQuery);
    mocks.modelEqMock.mockReturnValue(modelQuery);
    mocks.modelSingleMock.mockResolvedValue({
      data: modelRow,
      error: null,
    });
    mocks.fromMock.mockImplementation((table: string) => {
      if (table === "models") {
        return { select: mocks.modelSelectMock };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const model = await fetchModelBySlug("cloud-sofa");

    expect(mocks.modelSelectMock).toHaveBeenCalledWith(
      expect.stringContaining("creator:profiles"),
    );
    expect(model?.creator).toEqual({
      avatar_path:
        "https://example.supabase.co/storage/v1/object/public/avatars/user-1/avatar.webp",
      username: "anna_kovalenko",
    });
    expect(model?.cover_image_path).toBe(
      "https://example.supabase.co/storage/v1/object/public/model-images/user-1/model-1/cover.webp",
    );
  });
});
