export const PUBLICATION_SOURCE_BUCKET = "model-draft-files";
export const PUBLICATION_COVER_BUCKET = "model-draft-images";
export const PUBLICATION_REQUEST_TIMEOUT_MS = 10_000;
export const PUBLICATION_UPLOAD_TIMEOUT_MS = 300_000;
export const PUBLICATION_COVER_URL_SECONDS = 60;
export const PUBLICATION_PAGE_SIZE = 5;
export const publicationErrors = [
  "unauthorized",
  "invalid_request",
  "draft_unavailable",
  "upload_not_allowed",
  "conflict",
  "busy",
  "not_ready",
  "file_unavailable",
  "already_published",
  "cleanup_incomplete",
  "storage_unavailable",
  "timeout",
  "session_changed",
  "generic",
] as const;
export const publicationOperations = [
  "create",
  "save",
  "reserve",
  "attach",
  "release",
  "prepare_publish",
  "finish_publish",
  "cancel_publish",
  "begin_delete",
  "cleanup",
  "finish_cleanup",
] as const;
