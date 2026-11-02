export const MODEL_MANAGEMENT_TIMEOUT_MS = 10_000;
export const MODEL_MANAGEMENT_CLEANUP_BATCH_SIZE = 100;

export const modelManagementRpcErrors = [
  "unauthorized",
  "invalid_request",
  "model_unavailable",
  "upload_not_allowed",
  "deletion_pending",
  "cleanup_incomplete",
  "storage_unavailable",
  "file_unavailable",
] as const;

export const modelManagementRpcResults = [
  "ok",
  ...modelManagementRpcErrors,
] as const;
export const modelManagementErrorCodes = [
  ...modelManagementRpcErrors,
  "generic",
  "timeout",
  "session_changed",
] as const;
export const modelManagementTextFields = [
  { name: "titleUa", multiline: false },
  { name: "titleEn", multiline: false },
  { name: "descriptionUa", multiline: true },
  { name: "descriptionEn", multiline: true },
] as const;
export const modelManagementMutationKey = (ownerId: string, modelId: string) =>
  ["model-management", ownerId, modelId] as const;

export const modelManagementRevalidationPaths = [
  "/[locale]/profile",
  "/[locale]/profile/uploads",
  "/[locale]/profile/library",
  "/[locale]/catalog",
  "/[locale]/catalog/[slug]",
  "/[locale]/designers",
  "/[locale]/designers/[username]",
] as const;
