"use server";

import {
  publicationDeleteSchema,
  publicationIdRequestSchema,
  publicationRevisionRequestSchema,
} from "@/src/business/schemas/modelPublication";
import type { PublicationMutation } from "@/src/business/types/modelPublication";
import {
  cleanPublicationFiles,
  copyPublicationFiles,
  managePublication,
  withPublicationClient,
} from "@/src/business/utils/supabase/modelPublicationFiles";

export async function publishPublicationDraftAction(
  input: unknown,
): Promise<PublicationMutation> {
  const request = publicationRevisionRequestSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withPublicationClient(async (context) => {
    const prepared = await managePublication(context, {
      requested_draft_id: request.data.draftId,
      requested_revision: request.data.revision,
      requested_operation: "prepare_publish",
    });
    if (!prepared.ok || prepared.data.lifecycle === "published")
      return prepared;
    if (prepared.data.lifecycle !== "publishing" || !prepared.data.model_id)
      return { ok: false, error: "generic" };
    const copied = await copyPublicationFiles(context, prepared.data.assets);
    if (copied) return copied;
    return managePublication(context, {
      requested_draft_id: request.data.draftId,
      requested_operation: "finish_publish",
    });
  });
}

export async function cleanupPublicationDraftAction(
  input: unknown,
): Promise<PublicationMutation> {
  const request = publicationIdRequestSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withPublicationClient((context) =>
    cleanPublicationFiles(context, request.data.draftId),
  );
}

export async function cancelPublicationDraftAction(
  input: unknown,
): Promise<PublicationMutation> {
  const request = publicationRevisionRequestSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withPublicationClient(async (context) => {
    const cancelled = await managePublication(context, {
      requested_draft_id: request.data.draftId,
      requested_revision: request.data.revision,
      requested_operation: "cancel_publish",
    });
    return cancelled.ok
      ? cleanPublicationFiles(context, request.data.draftId)
      : cancelled;
  });
}

export async function deletePublicationDraftAction(
  input: unknown,
): Promise<PublicationMutation> {
  const request = publicationDeleteSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withPublicationClient(async (context) => {
    const pending = await managePublication(context, {
      requested_draft_id: request.data.draftId,
      requested_revision: request.data.revision,
      requested_operation: "begin_delete",
    });
    return pending.ok
      ? cleanPublicationFiles(context, request.data.draftId)
      : pending;
  });
}
