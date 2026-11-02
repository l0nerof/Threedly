import { catalogQueryKeys } from "@/src/business/queries/catalog";
import { designersQueryKeys } from "@/src/business/queries/designers";
import type { ModelDownloadActionError } from "@/src/business/types/modelDownload";

export const modelDownloadErrorKeys = {
  unauthorized: "unauthorized",
  model_unavailable: "modelUnavailable",
  file_unavailable: "fileUnavailable",
  plan_required: "planRequired",
  quota_exceeded: "quotaExceeded",
  invalidRequest: "invalidRequest",
  storageUnavailable: "storageUnavailable",
  timeout: "timeout",
  generic: "generic",
} as const satisfies Record<ModelDownloadActionError, string>;

export const modelDownloadQueryKeys = [
  catalogQueryKeys.root,
  designersQueryKeys.root,
] as const;

export const MODEL_FILES_LIMIT = 100;
