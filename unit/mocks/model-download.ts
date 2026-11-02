import type { Tables } from "@/src/business/types/database.generated";
import type { User } from "@supabase/supabase-js";
import { vi } from "vitest";

export const modelDownloadFixture = {
  user: {
    id: "00000000-0000-0000-0000-000000000101",
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  } satisfies User,
  profile: {
    id: "00000000-0000-0000-0000-000000000101",
    plan_key: "free",
  } satisfies Pick<Tables<"profiles">, "id" | "plan_key">,
  model: {
    id: "00000000-0000-0000-0000-000000000201",
    creator_id: "00000000-0000-0000-0000-000000000102",
    minimum_plan: "free",
    status: "published",
  } satisfies Pick<
    Tables<"models">,
    "id" | "creator_id" | "minimum_plan" | "status"
  >,
  file: {
    id: "00000000-0000-0000-0000-000000000301",
    model_id: "00000000-0000-0000-0000-000000000201",
    storage_provider: "supabase",
    bucket: "models",
    object_path:
      "00000000-0000-0000-0000-000000000102/00000000-0000-0000-0000-000000000201/source.obj",
    file_name: "source.obj",
  } satisfies Pick<
    Tables<"model_files">,
    | "id"
    | "model_id"
    | "storage_provider"
    | "bucket"
    | "object_path"
    | "file_name"
  >,
  supabaseUrl: "https://download-test.supabase.co",
};

export function buildModelDownloadSignedUrl(objectPath: string): string {
  return `${modelDownloadFixture.supabaseUrl}/storage/v1/object/sign/models/${objectPath}?token=test-signed-token&download`;
}

function createReadQuery() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  };
}

const profileQuery = createReadQuery();
const modelQuery = createReadQuery();
const fileQuery = createReadQuery();
const getUser = vi.fn();
const createSignedUrl = vi.fn();
const storageFrom = vi.fn(() => ({ createSignedUrl }));
const rpcResult = vi.fn();
const rpcAbortSignal = vi.fn((signal: AbortSignal) => {
  signal.throwIfAborted();
  return rpcResult();
});
const rpc = vi.fn(() => ({ abortSignal: rpcAbortSignal }));
const userFrom = vi.fn((table: string) => {
  if (table === "profiles") return profileQuery;
  if (table === "models") return modelQuery;
  throw new Error("Unexpected user table in download action.");
});
const adminFrom = vi.fn((table: string) => {
  if (table === "model_files") return fileQuery;
  throw new Error("Unexpected administrative table in download action.");
});
const userClient = { auth: { getUser }, from: userFrom, rpc };
const adminClient = {
  from: adminFrom,
  storage: { from: storageFrom },
};

export const modelDownloadMocks = {
  createUserClient: vi.fn(),
  createAdminClient: vi.fn(),
  getUser,
  userFrom,
  adminFrom,
  profileQuery,
  modelQuery,
  fileQuery,
  storageFrom,
  createSignedUrl,
  rpc,
  rpcAbortSignal,
  rpcResult,
};

export function resetModelDownloadMocks(): void {
  vi.clearAllMocks();
  modelDownloadMocks.createUserClient.mockReset().mockResolvedValue(userClient);
  modelDownloadMocks.createAdminClient.mockReset().mockReturnValue(adminClient);
  getUser.mockReset().mockResolvedValue({
    data: { user: { ...modelDownloadFixture.user } },
    error: null,
  });
  for (const [query, data] of [
    [profileQuery, modelDownloadFixture.profile],
    [modelQuery, modelDownloadFixture.model],
    [fileQuery, modelDownloadFixture.file],
  ] as const) {
    query.maybeSingle.mockReset().mockResolvedValue({
      data: { ...data },
      error: null,
      status: 200,
      statusText: "OK",
    });
  }
  createSignedUrl.mockReset().mockResolvedValue({
    data: {
      signedUrl: buildModelDownloadSignedUrl(
        modelDownloadFixture.file.object_path,
      ),
    },
    error: null,
  });
  rpcResult.mockReset().mockResolvedValue({
    data: "ok",
    error: null,
    status: 200,
    statusText: "OK",
  });
}
