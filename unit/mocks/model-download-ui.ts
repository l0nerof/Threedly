import type {
  ModelDownloadActionResult,
  ModelDownloadRequest,
  ModelFileSummary,
} from "@/src/business/types/modelDownload";
import { vi } from "vitest";
import { modelDownloadFixture } from "./model-download";

export const downloadUiFixture = {
  modelId: modelDownloadFixture.model.id,
  file: {
    id: modelDownloadFixture.file.id,
    file_name: "chair.obj",
    format: "obj",
    file_size_bytes: 1_500_000,
    is_primary: true,
  } satisfies ModelFileSummary,
  url: "https://download-test.supabase.co/storage/v1/object/sign/models/source.obj?token=unit-test",
};

export const downloadActionMock =
  vi.fn<(input: ModelDownloadRequest) => Promise<ModelDownloadActionResult>>();
export const downloadRouterRefreshMock = vi.fn();

export function createDownloadNavigationMock() {
  return {
    useRouter: () => ({ refresh: downloadRouterRefreshMock }),
    usePathname: () => "/en/catalog",
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({ locale: "en" }),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
  };
}

export function createDeferredDownload() {
  let resolve!: (result: ModelDownloadActionResult) => void;
  const promise = new Promise<ModelDownloadActionResult>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const modelQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  abortSignal: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
};
const filesQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  abortSignal: vi.fn(),
};

export const modelFilesMocks = {
  modelQuery,
  filesQuery,
  createUserClient: vi.fn(),
  createAdminClient: vi.fn(),
  userFrom: vi.fn(() => modelQuery),
  adminFrom: vi.fn(() => filesQuery),
};

export function resetModelFilesMocks() {
  vi.clearAllMocks();
  modelFilesMocks.createUserClient
    .mockReset()
    .mockResolvedValue({ from: modelFilesMocks.userFrom });
  modelFilesMocks.createAdminClient
    .mockReset()
    .mockReturnValue({ from: modelFilesMocks.adminFrom });
  modelQuery.maybeSingle.mockReset().mockResolvedValue({
    data: { id: downloadUiFixture.modelId, status: "published" },
    error: null,
  });
  filesQuery.abortSignal
    .mockReset()
    .mockResolvedValue({ data: [{ ...downloadUiFixture.file }], error: null });
}
