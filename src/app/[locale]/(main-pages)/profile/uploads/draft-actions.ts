"use server";

import { PUBLICATION_PAGE_SIZE } from "@/src/business/constants/modelPublication";
import {
  publicationAssetSchema,
  publicationAttachSchema,
  publicationDraftRowSchema,
  publicationEditorDraftSchema,
  publicationIdRequestSchema,
  publicationPageSchema,
  publicationReserveSchema,
  publicationSaveSchema,
  publicationStoredAssetSchema,
} from "@/src/business/schemas/modelPublication";
import type {
  PublicationEditorData,
  PublicationMutation,
  PublicationResult,
} from "@/src/business/types/modelPublication";
import {
  awaitPublicationRequest,
  isPublicationAssetPath,
} from "@/src/business/utils/modelPublication";
import {
  managePublication,
  signPublicationCover,
  withPublicationClient,
} from "@/src/business/utils/supabase/modelPublicationFiles";

const draftColumns =
  "id,creator_id,title_ua,title_en,description_ua,description_en,category_id,minimum_plan,revision,lifecycle,publication_model_id,source_asset_id,cover_asset_id,created_at,updated_at";

export async function createPublicationDraftAction(
  input: unknown,
): Promise<PublicationMutation> {
  const request = publicationIdRequestSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withPublicationClient((context) =>
    managePublication(context, {
      requested_draft_id: request.data.draftId,
      requested_operation: "create",
    }),
  );
}

export async function savePublicationDraftAction(
  input: unknown,
): Promise<PublicationMutation> {
  const request = publicationSaveSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withPublicationClient((context) =>
    managePublication(context, {
      requested_draft_id: request.data.draftId,
      requested_operation: "save",
      requested_revision: request.data.revision,
      requested_payload: request.data.metadata,
    }),
  );
}

export async function reservePublicationAssetAction(
  input: unknown,
): Promise<PublicationMutation> {
  const request = publicationReserveSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withPublicationClient((context) =>
    managePublication(context, {
      requested_draft_id: request.data.draftId,
      requested_operation: "reserve",
      requested_revision: request.data.revision,
      requested_payload: request.data.file,
    }),
  );
}

export async function attachPublicationAssetAction(
  input: unknown,
): Promise<PublicationMutation> {
  const request = publicationAttachSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withPublicationClient((context) =>
    managePublication(context, {
      requested_draft_id: request.data.draftId,
      requested_operation: "attach",
      requested_revision: request.data.revision,
      requested_payload: { assetId: request.data.assetId },
    }),
  );
}

export async function releasePublicationAssetAction(
  input: unknown,
): Promise<PublicationMutation> {
  const request = publicationAttachSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withPublicationClient((context) =>
    managePublication(context, {
      requested_draft_id: request.data.draftId,
      requested_operation: "release",
      requested_revision: request.data.revision,
      requested_payload: { assetId: request.data.assetId },
    }),
  );
}

export async function fetchPublicationDraftAction(
  input: unknown,
): Promise<PublicationResult<PublicationEditorData>> {
  const request = publicationIdRequestSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withPublicationClient(async (context) => {
    const response = await awaitPublicationRequest(
      context.client
        .from("model_publication_drafts")
        .select(draftColumns)
        .eq("id", request.data.draftId)
        .eq("creator_id", context.userId)
        .abortSignal(context.signal)
        .maybeSingle(),
      context.signal,
    );
    if (response.error) return { ok: false, error: "generic" };
    if (!response.data) return { ok: false, error: "draft_unavailable" };
    const parsed = publicationDraftRowSchema.safeParse(response.data);
    if (
      !parsed.success ||
      parsed.data.id !== request.data.draftId ||
      parsed.data.creator_id !== context.userId
    ) {
      return { ok: false, error: "generic" };
    }
    const draft = parsed.data;
    const responseAssets = await awaitPublicationRequest(
      context.client
        .from("model_publication_assets")
        .select(
          "id,draft_id,kind,object_path,file_name,extension,mime_type,byte_size,state",
        )
        .eq("draft_id", draft.id)
        .eq("state", "active")
        .limit(3)
        .abortSignal(context.signal),
      context.signal,
    );
    const stored = publicationStoredAssetSchema
      .array()
      .max(2)
      .safeParse(responseAssets.data);
    if (responseAssets.error || !stored.success)
      return { ok: false, error: "generic" };
    const assets = [];
    for (const asset of stored.data) {
      const normalized = publicationAssetSchema.safeParse({
        id: asset.id,
        draftId: asset.draft_id,
        kind: asset.kind,
        bucket:
          asset.kind === "cover" ? "model-draft-images" : "model-draft-files",
        path: asset.object_path,
        name: asset.file_name,
        extension: asset.extension,
        mimeType: asset.mime_type,
        size: asset.byte_size,
        state: asset.state,
        destinationBucket: null,
        destinationPath: null,
      });
      if (
        !normalized.success ||
        !isPublicationAssetPath(normalized.data, context.userId, draft.id, null)
      ) {
        return { ok: false, error: "storage_unavailable" };
      }
      assets.push(normalized.data);
    }
    const source = assets.find((asset) => asset.kind === "source") ?? null;
    const cover = assets.find((asset) => asset.kind === "cover") ?? null;
    if (
      (source?.id ?? null) !== draft.source_asset_id ||
      (cover?.id ?? null) !== draft.cover_asset_id ||
      new Set(assets.map((asset) => asset.kind)).size !== assets.length
    )
      return { ok: false, error: "generic" };
    let coverUrl: string | null = null;
    if (cover) {
      const signed = await signPublicationCover(context, cover);
      if (!signed.ok) return signed;
      coverUrl = signed.data;
    }
    let cleanupPending = false;
    if (draft.lifecycle === "published") {
      const counted = await awaitPublicationRequest(
        context.client
          .from("model_publication_assets")
          .select("id", { count: "exact", head: true })
          .eq("draft_id", draft.id)
          .abortSignal(context.signal),
        context.signal,
      );
      if (
        counted.error ||
        counted.count === null ||
        !Number.isSafeInteger(counted.count) ||
        counted.count < 0
      )
        return { ok: false, error: "generic" };
      cleanupPending = counted.count > 0;
    }
    const safeDraft = publicationEditorDraftSchema.parse(draft);
    const summary = (asset: typeof source) =>
      asset
        ? {
            id: asset.id,
            kind: asset.kind,
            name: asset.name,
            size: asset.size,
            extension: asset.extension,
          }
        : null;
    return {
      ok: true,
      data: {
        draft: safeDraft,
        source: summary(source),
        cover: summary(cover),
        coverUrl,
        cleanupPending,
      },
    };
  });
}

export async function fetchPublicationDraftsPageAction(
  input: unknown = {},
): Promise<
  PublicationResult<{
    drafts: PublicationEditorData["draft"][];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }>
> {
  const request = publicationPageSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withPublicationClient(async (context) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const counted = await awaitPublicationRequest(
        context.client
          .from("model_publication_drafts")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", context.userId)
          .neq("lifecycle", "published")
          .abortSignal(context.signal),
        context.signal,
      );
      if (
        counted.error ||
        counted.count === null ||
        !Number.isSafeInteger(counted.count) ||
        counted.count < 0
      )
        return { ok: false, error: "generic" };
      const totalCount = counted.count;
      const totalPages = Math.max(
        1,
        Math.ceil(totalCount / PUBLICATION_PAGE_SIZE),
      );
      const currentPage = Math.min(request.data.page, totalPages);
      const offset = (currentPage - 1) * PUBLICATION_PAGE_SIZE;
      const response = await awaitPublicationRequest(
        context.client
          .from("model_publication_drafts")
          .select(draftColumns)
          .eq("creator_id", context.userId)
          .neq("lifecycle", "published")
          .order("updated_at", { ascending: false })
          .order("id", { ascending: true })
          .range(offset, offset + PUBLICATION_PAGE_SIZE - 1)
          .abortSignal(context.signal),
        context.signal,
      );
      const rows = publicationDraftRowSchema
        .array()
        .max(PUBLICATION_PAGE_SIZE)
        .safeParse(response.data);
      if (
        response.error ||
        !rows.success ||
        rows.data.some(
          (draft) =>
            draft.creator_id !== context.userId ||
            draft.lifecycle === "published",
        ) ||
        new Set(rows.data.map((draft) => draft.id)).size !== rows.data.length
      )
        return { ok: false, error: "generic" };
      if (
        rows.data.length !==
        Math.min(PUBLICATION_PAGE_SIZE, totalCount - offset)
      )
        continue;
      return {
        ok: true,
        data: {
          drafts: rows.data.map((draft) =>
            publicationEditorDraftSchema.parse(draft),
          ),
          totalCount,
          totalPages,
          currentPage,
        },
      };
    }
    return { ok: false, error: "generic" };
  });
}
