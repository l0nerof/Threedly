import type { Database } from "@/src/business/types/database.generated";
import type { ModelManagementMetadata } from "@/src/business/types/modelManagement";
import type { User } from "@supabase/supabase-js";
import { vi } from "vitest";

const userId = "00000000-0000-0000-0000-00000000a901";
const modelId = "00000000-0000-0000-0000-00000000a921";
const categoryId = "00000000-0000-0000-0000-00000000a912";
export const modelManagementFixture = {
  user: {
    id: userId,
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  } satisfies User,
  model: {
    id: modelId,
    creator_id: userId,
    category_id: categoryId,
    slug: "model-a921",
    title_ua: "Назва моделі",
    title_en: "Model title",
    description_ua: null,
    description_en: null,
    minimum_plan: "free",
    status: "published",
    deletion_pending: false,
  },
  listRow: {
    id: modelId,
    creator_id: userId,
    title_ua: "Назва моделі",
    title_en: "Model title",
    status: "published",
    deletion_pending: false,
    file_format: "obj",
    file_size_bytes: 1024,
    created_at: "2026-10-19T12:00:00Z",
    updated_at: "2026-10-19T12:00:00Z",
  },
  profile: { id: userId, can_upload: true },
  categoryGroups: [
    {
      id: "00000000-0000-0000-0000-00000000a911",
      slug: "furniture",
      name_ua: "Меблі",
      name_en: "Furniture",
      sort_order: 0,
      categories: [
        {
          id: categoryId,
          slug: "chairs",
          name_ua: "Стільці",
          name_en: "Chairs",
          sort_order: 0,
          is_featured: false,
        },
      ],
    },
  ],
  metadata: {
    titleUa: "Нова назва",
    titleEn: "New title",
    descriptionUa: "Опис",
    descriptionEn: null,
    categoryId,
    minimumPlan: "pro",
  } satisfies ModelManagementMetadata,
  row: {
    result: "ok",
    model_id: modelId,
    model_paths: [],
    image_paths: [],
  } satisfies Database["public"]["Functions"]["manage_owned_model"]["Returns"][number],
  modelPaths: [
    `${userId}/${modelId}/source.obj`,
    `${userId}/${modelId}/preview.glb`,
  ],
  imagePaths: [`${userId}/${modelId}/cover.webp`],
};

const getUser = vi.fn();
const rpcSingle = vi.fn();
const readSingle = vi.fn();
const rpcAbort = vi.fn<(signal: AbortSignal) => { single: typeof rpcSingle }>(
  () => ({ single: rpcSingle }),
);
const rpc = vi.fn<
  (
    name: string,
    args: Database["public"]["Functions"]["manage_owned_model"]["Args"],
  ) => { abortSignal: typeof rpcAbort }
>(() => ({ abortSignal: rpcAbort }));
const readAbort = vi.fn(() => ({ maybeSingle: readSingle }));
const countResult = vi.fn();
const countEq = vi.fn(() => ({ abortSignal: countResult }));
const listResult = vi.fn();
const range = vi.fn(() => ({ abortSignal: listResult }));
const order = vi.fn();
order.mockImplementation(() => ({ order, range }));
const modelEq = vi.fn();
modelEq.mockImplementation(() => ({
  eq: modelEq,
  abortSignal: readAbort,
  order,
}));
const select = vi.fn((_columns: string, options?: { head?: boolean }) => ({
  eq: options?.head ? countEq : modelEq,
}));
const profileSingle = vi.fn();
const profileEq = vi.fn(() => ({
  abortSignal: () => ({ maybeSingle: profileSingle }),
}));
const categoriesResult = vi.fn();
const categoriesOrder = vi.fn(() => ({ abortSignal: categoriesResult }));
const from = vi.fn((table: string) => {
  if (table === "profiles") return { select: () => ({ eq: profileEq }) };
  if (table === "category_groups")
    return { select: () => ({ order: categoriesOrder }) };
  return { select };
});
const remove = vi.fn();
const storageFrom = vi.fn(() => ({ remove }));

export const modelManagementMocks = {
  createClient: vi.fn(),
  getUser,
  rpc,
  rpcSingle,
  rpcAbort,
  from,
  select,
  modelEq,
  readSingle,
  readAbort,
  countEq,
  countResult,
  listResult,
  range,
  order,
  profileSingle,
  profileEq,
  categoriesResult,
  storageFrom,
  remove,
  revalidatePath: vi.fn(),
};

export function resetModelManagementMocks() {
  vi.clearAllMocks();
  modelManagementMocks.createClient.mockReset().mockResolvedValue({
    auth: { getUser },
    rpc,
    from,
    storage: { from: storageFrom },
  });
  getUser.mockReset().mockResolvedValue({
    data: { user: { ...modelManagementFixture.user } },
    error: null,
  });
  rpcSingle.mockReset().mockResolvedValue({
    data: { ...modelManagementFixture.row },
    error: null,
  });
  readSingle.mockReset().mockResolvedValue({
    data: { ...modelManagementFixture.model },
    error: null,
  });
  countResult
    .mockReset()
    .mockResolvedValue({ data: null, count: 1, error: null });
  listResult.mockReset().mockResolvedValue({
    data: [{ ...modelManagementFixture.listRow }],
    error: null,
  });
  profileSingle.mockReset().mockResolvedValue({
    data: { ...modelManagementFixture.profile },
    error: null,
  });
  categoriesResult.mockReset().mockResolvedValue({
    data: modelManagementFixture.categoryGroups,
    error: null,
  });
  modelManagementRouter.refresh.mockReset();
  modelManagementRouter.push.mockReset();
  remove.mockReset().mockResolvedValue({ data: [], error: null });
}

export const modelManagementRouter = {
  refresh: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
};
export function createModelManagementNavigationMock() {
  return {
    useRouter: () => modelManagementRouter,
    usePathname: () => "/en/profile/uploads",
    useSearchParams: () => new URLSearchParams(),
  };
}

export function installModelManagementBrowserApis() {
  const original = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollIntoView",
  );
  if (!HTMLElement.prototype.scrollIntoView)
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  return () => {
    if (original)
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", original);
    else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  };
}

export function queueModelCleanup() {
  modelManagementMocks.rpcSingle.mockResolvedValueOnce({
    data: {
      ...modelManagementFixture.row,
      model_paths: [...modelManagementFixture.modelPaths],
      image_paths: [...modelManagementFixture.imagePaths],
    },
    error: null,
  });
}

export function deferredModelManagementResponse<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
