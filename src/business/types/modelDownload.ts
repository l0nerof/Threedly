import type {
  modelDownloadRequestSchema,
  modelFileSummarySchema,
} from "@/src/business/schemas/modelDownload";
import type { Enums } from "@/src/business/types/database.generated";
import type { z } from "zod";

export type ModelDownloadRequest = z.infer<typeof modelDownloadRequestSchema>;

export type ModelDownloadActionError =
  | Exclude<Enums<"model_download_status">, "ok">
  | "invalidRequest"
  | "storageUnavailable"
  | "timeout"
  | "generic";

export type ModelDownloadActionResult =
  | { ok: true; url: string }
  | { ok: false; error: ModelDownloadActionError };

export type ModelFileSummary = z.infer<typeof modelFileSummarySchema>;

export type ModelFilesResult =
  | { ok: true; files: ModelFileSummary[] }
  | { ok: false };
