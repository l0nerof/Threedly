import type { Database } from "@/src/business/types/database.generated";
import type {
  PublicationAsset,
  PublicationDraft,
  PublicationMetadata,
  PublicationRpc,
} from "@/src/business/types/modelPublication";
import type { User } from "@supabase/supabase-js";
import { vi } from "vitest";

const userId = "00000000-0000-0000-0000-00000000f001";
const draftId = "00000000-0000-0000-0000-00000000f201";
const modelId = "00000000-0000-0000-0000-00000000f301";
const sourceId = "00000000-0000-0000-0000-00000000f401";
const coverId = "00000000-0000-0000-0000-00000000f402";
export const publicationFixture = {
  user: {
    id: userId,
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  } satisfies User,
  modelId,
  draft: {
    id: draftId,
    creator_id: userId,
    title_ua: "",
    title_en: "",
    description_ua: null,
    description_en: null,
    category_id: null,
    minimum_plan: "free",
    revision: 0,
    lifecycle: "draft",
    publication_model_id: null,
    source_asset_id: null,
    cover_asset_id: null,
    created_at: "2026-10-22T12:00:00Z",
    updated_at: "2026-10-22T12:00:00Z",
  } satisfies PublicationDraft,
  metadata: {
    titleUa: "",
    titleEn: "A",
    descriptionUa: null,
    descriptionEn: "",
    categoryId: null,
    minimumPlan: "free",
  } satisfies PublicationMetadata,
  source: {
    id: sourceId,
    draftId,
    kind: "source",
    name: "Sofa.OBJ",
    extension: "obj",
    mimeType: "application/octet-stream",
    size: 5,
    bucket: "model-draft-files",
    path: userId + "/" + draftId + "/" + sourceId + ".obj",
    state: "reserved",
    destinationBucket: null,
    destinationPath: null,
  } satisfies PublicationAsset,
  cover: {
    id: coverId,
    draftId,
    kind: "cover",
    name: "cover.png",
    extension: "png",
    mimeType: "image/png",
    size: 7,
    bucket: "model-draft-images",
    path: userId + "/" + draftId + "/" + coverId + ".png",
    state: "active",
    destinationBucket: null,
    destinationPath: null,
  } satisfies PublicationAsset,
};

export function publicationRow(
  overrides: Partial<PublicationRpc> = {},
): PublicationRpc {
  return {
    result: "ok",
    draft_id: draftId,
    revision: 0,
    lifecycle: "draft",
    model_id: null,
    assets: [],
    objects: [],
    ...overrides,
  };
}
export function publicationPreparedRow(): PublicationRpc {
  return publicationRow({
    revision: 1,
    lifecycle: "publishing",
    model_id: modelId,
    assets: [
      {
        ...publicationFixture.source,
        state: "active",
        destinationBucket: "models",
        destinationPath: userId + "/" + modelId + "/sofa.obj",
      },
      {
        ...publicationFixture.cover,
        destinationBucket: "model-images",
        destinationPath: userId + "/" + modelId + "/cover.png",
      },
    ],
  });
}
export function publicationStoredAsset(asset: PublicationAsset) {
  return {
    id: asset.id,
    draft_id: asset.draftId,
    kind: asset.kind,
    object_path: asset.path,
    file_name: asset.name,
    extension: asset.extension,
    mime_type: asset.mimeType,
    byte_size: asset.size,
    state: asset.state,
  };
}
export function publicationDeferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const getUser = vi.fn();
const rpcSingle = vi.fn();
const rpcAbort = vi.fn(() => ({ single: rpcSingle }));
const rpc = vi.fn<
  (
    name: string,
    args: Database["public"]["Functions"]["manage_publication_draft"]["Args"],
  ) => { abortSignal: typeof rpcAbort }
>(() => ({ abortSignal: rpcAbort }));
const readSingle = vi.fn();
const readAbort = vi.fn(() => ({ maybeSingle: readSingle }));
const countResult = vi.fn();
const countNeq = vi.fn(() => ({ abortSignal: countResult }));
const countEq = vi.fn(() => ({ neq: countNeq, abortSignal: countResult }));
const listResult = vi.fn();
const range = vi.fn(() => ({ abortSignal: listResult }));
const order = vi.fn();
order.mockImplementation(() => ({ order, range }));
const draftEq = vi.fn();
const draftNeq = vi.fn(() => ({ order }));
draftEq.mockImplementation(() => ({
  eq: draftEq,
  neq: draftNeq,
  abortSignal: readAbort,
  order,
}));
const select = vi.fn((_columns: string, options?: { head?: boolean }) => ({
  eq: options?.head ? countEq : draftEq,
}));
const assetsResult = vi.fn();
const assetCountResult = vi.fn();
const assetCountEq = vi.fn(() => ({ abortSignal: assetCountResult }));
const assetLimit = vi.fn(() => ({ abortSignal: assetsResult }));
const assetEq = vi.fn();
assetEq.mockImplementation(() => ({ eq: assetEq, limit: assetLimit }));
const assetsSelect = vi.fn(
  (_columns: string, options?: { head?: boolean }) => ({
    eq: options?.head ? assetCountEq : assetEq,
  }),
);
const from = vi.fn((table: string) =>
  table === "model_publication_assets" ? { select: assetsSelect } : { select },
);
const upload = vi.fn();
const copy = vi.fn();
const remove = vi.fn();
const createSignedUrl = vi.fn();
const storageFrom = vi.fn(() => ({ upload, copy, remove, createSignedUrl }));
const client = { auth: { getUser }, rpc, from, storage: { from: storageFrom } };

export const publicationMocks = {
  createClient: vi.fn(),
  browserClient: vi.fn(),
  revalidatePath: vi.fn(),
  getUser,
  rpc,
  rpcSingle,
  rpcAbort,
  from,
  select,
  draftEq,
  readSingle,
  countEq,
  countNeq,
  draftNeq,
  countResult,
  listResult,
  range,
  order,
  assetsResult,
  assetCountResult,
  assetCountEq,
  assetsSelect,
  assetLimit,
  assetEq,
  upload,
  copy,
  remove,
  createSignedUrl,
  storageFrom,
  reserve: vi.fn(),
  attach: vi.fn(),
};
export function resetPublicationMocks() {
  vi.clearAllMocks();
  publicationMocks.createClient.mockReset().mockResolvedValue(client);
  publicationMocks.browserClient.mockReset().mockReturnValue(client);
  getUser.mockReset().mockResolvedValue({
    data: { user: { ...publicationFixture.user } },
    error: null,
  });
  rpcSingle
    .mockReset()
    .mockResolvedValue({ data: publicationRow(), error: null });
  readSingle
    .mockReset()
    .mockResolvedValue({ data: { ...publicationFixture.draft }, error: null });
  countResult
    .mockReset()
    .mockResolvedValue({ data: null, count: 1, error: null });
  listResult.mockReset().mockResolvedValue({
    data: [{ ...publicationFixture.draft }],
    error: null,
  });
  assetsResult.mockReset().mockResolvedValue({ data: [], error: null });
  assetCountResult
    .mockReset()
    .mockResolvedValue({ data: null, count: 0, error: null });
  upload.mockReset().mockResolvedValue({
    data: { path: publicationFixture.source.path },
    error: null,
  });
  copy.mockReset().mockResolvedValue({ data: {}, error: null });
  remove.mockReset().mockResolvedValue({ data: [], error: null });
  createSignedUrl.mockReset().mockResolvedValue({
    data: {
      signedUrl:
        "http://127.0.0.1:55321/storage/v1/object/sign/model-draft-images/" +
        publicationFixture.cover.path +
        "?token=test",
    },
    error: null,
  });
  publicationMocks.reserve.mockReset().mockResolvedValue({
    ok: true,
    data: publicationRow({ assets: [{ ...publicationFixture.source }] }),
  });
  publicationMocks.attach
    .mockReset()
    .mockResolvedValue({ ok: true, data: publicationRow({ revision: 1 }) });
}
