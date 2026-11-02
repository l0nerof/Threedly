import type {
  publicationErrors,
  publicationOperations,
} from "@/src/business/constants/modelPublication";
import type {
  publicationAssetSchema,
  publicationDraftRowSchema,
  publicationManifestSchema,
  publicationMetadataSchema,
  publicationObjectSchema,
  publicationRpcSchema,
} from "@/src/business/schemas/modelPublication";
import type { createClient } from "@/src/business/utils/supabase/server";
import type { z } from "zod";

export type PublicationMetadata = z.infer<typeof publicationMetadataSchema>;
export type PublicationManifest = z.infer<typeof publicationManifestSchema>;
export type PublicationAsset = z.infer<typeof publicationAssetSchema>;
export type PublicationDraft = z.infer<typeof publicationDraftRowSchema>;
export type PublicationObject = z.infer<typeof publicationObjectSchema>;
export type PublicationRpc = z.infer<typeof publicationRpcSchema>;
export type PublicationOperation = (typeof publicationOperations)[number];
export type PublicationFailure = {
  ok: false;
  error: (typeof publicationErrors)[number];
};
export type PublicationResult<T> = { ok: true; data: T } | PublicationFailure;
export type PublicationMutation = PublicationResult<PublicationRpc>;
export type PublicationContext = {
  client: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  signal: AbortSignal;
  writeAttempted: boolean;
};
export type PublicationAssetSummary = Pick<
  PublicationAsset,
  "id" | "kind" | "name" | "size" | "extension"
>;
export type PublicationEditorData = {
  draft: Omit<PublicationDraft, "source_asset_id" | "cover_asset_id">;
  source: PublicationAssetSummary | null;
  cover: PublicationAssetSummary | null;
  coverUrl: string | null;
  cleanupPending: boolean;
};
