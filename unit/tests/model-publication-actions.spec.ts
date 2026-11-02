import {
  attachPublicationAssetAction,
  createPublicationDraftAction,
  fetchPublicationDraftAction,
  fetchPublicationDraftsPageAction,
  releasePublicationAssetAction,
  reservePublicationAssetAction,
  savePublicationDraftAction,
} from "@/src/app/[locale]/(main-pages)/profile/uploads/draft-actions";
import {
  cancelPublicationDraftAction,
  cleanupPublicationDraftAction,
  deletePublicationDraftAction,
  publishPublicationDraftAction,
} from "@/src/app/[locale]/(main-pages)/profile/uploads/publication-actions";
import { PUBLICATION_REQUEST_TIMEOUT_MS } from "@/src/business/constants/modelPublication";
import { redirect } from "next/navigation";
import { vi } from "vitest";
import { afterEach, beforeEach, describe, expect, it } from "../fixtures";
import {
  publicationFixture as fixture,
  publicationMocks as mocks,
  publicationDeferred,
  publicationPreparedRow,
  publicationRow,
  publicationStoredAsset,
  resetPublicationMocks,
} from "../mocks/model-publication";

vi.mock("@/src/business/utils/supabase/server", async () => ({
  createClient: (await import("../mocks/model-publication")).publicationMocks
    .createClient,
}));
vi.mock("next/cache", async () => ({
  revalidatePath: (await import("../mocks/model-publication")).publicationMocks
    .revalidatePath,
}));

const id = { draftId: fixture.draft.id };
const version = { ...id, revision: 0 };
beforeEach(() => {
  resetPublicationMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55321");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("publication actions", () => {
  it("creates a stable caller-scoped draft without accepting an owner", async () => {
    expect(await createPublicationDraftAction(id)).toEqual({
      ok: true,
      data: publicationRow(),
    });
    expect(mocks.rpc).toHaveBeenCalledWith("manage_publication_draft", {
      requested_draft_id: id.draftId,
      requested_operation: "create",
    });
    expect(mocks.rpcAbort).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(mocks.revalidatePath).toHaveBeenCalled();
  });
  it("saves incomplete metadata with the expected revision", async () => {
    expect(
      (
        await savePublicationDraftAction({
          ...version,
          metadata: fixture.metadata,
        })
      ).ok,
    ).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("manage_publication_draft", {
      requested_draft_id: id.draftId,
      requested_operation: "save",
      requested_revision: 0,
      requested_payload: fixture.metadata,
    });
  });
  it.each([
    "conflict",
    "upload_not_allowed",
    "busy",
    "draft_unavailable",
  ] as const)("does not report success for %s", async (result) => {
    mocks.rpcSingle.mockResolvedValueOnce({
      data: publicationRow({ result }),
      error: null,
    });
    expect(
      await savePublicationDraftAction({
        ...version,
        metadata: fixture.metadata,
      }),
    ).toEqual({ ok: false, error: result });
  });
  it.each([{ draftId: "invalid" }, { ...id, creatorId: fixture.user.id }])(
    "rejects untrusted create input before Auth %j",
    async (input) => {
      expect(await createPublicationDraftAction(input)).toEqual({
        ok: false,
        error: "invalid_request",
      });
      expect(mocks.createClient).not.toHaveBeenCalled();
    },
  );
  it("requires explicit deletion confirmation", async () => {
    expect(await deletePublicationDraftAction(version)).toEqual({
      ok: false,
      error: "invalid_request",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rejects guests and distinguishes an Auth outage", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    expect(await createPublicationDraftAction(id)).toEqual({
      ok: false,
      error: "unauthorized",
    });
    mocks.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { status: 503 },
    });
    expect(await createPublicationDraftAction(id)).toEqual({
      ok: false,
      error: "generic",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("bounds Auth and never starts a write from a late response", async () => {
    vi.useFakeTimers();
    const late = publicationDeferred<{
      data: { user: typeof fixture.user };
      error: null;
    }>();
    mocks.getUser.mockReturnValueOnce(late.promise);
    const pending = createPublicationDraftAction(id);
    await vi.advanceTimersByTimeAsync(PUBLICATION_REQUEST_TIMEOUT_MS + 1);
    expect(await pending).toEqual({ ok: false, error: "timeout" });
    late.resolve({ data: { user: fixture.user }, error: null });
    await Promise.resolve();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("preserves Next.js control-flow errors", async () => {
    mocks.rpcSingle.mockImplementationOnce(() => redirect("/ua/login"));
    await expect(createPublicationDraftAction(id)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
  });
  it("sends only validated file manifests and asset IDs", async () => {
    const file = {
      kind: "source",
      name: "Sofa.OBJ",
      extension: "obj",
      mimeType: "application/octet-stream",
      size: 5,
    };
    expect((await reservePublicationAssetAction({ ...version, file })).ok).toBe(
      true,
    );
    expect(
      (
        await attachPublicationAssetAction({
          ...version,
          assetId: fixture.source.id,
        })
      ).ok,
    ).toBe(true);
    expect(
      (
        await releasePublicationAssetAction({
          ...version,
          assetId: fixture.source.id,
        })
      ).ok,
    ).toBe(true);
    expect(mocks.rpc).toHaveBeenLastCalledWith("manage_publication_draft", {
      requested_draft_id: id.draftId,
      requested_operation: "release",
      requested_revision: 0,
      requested_payload: { assetId: fixture.source.id },
    });
  });
  it("prepares, copies both files and finalizes exactly once", async () => {
    const published = publicationRow({
      lifecycle: "published",
      model_id: fixture.modelId,
      revision: 2,
    });
    mocks.rpcSingle
      .mockResolvedValueOnce({ data: publicationPreparedRow(), error: null })
      .mockResolvedValueOnce({ data: published, error: null });
    expect(await publishPublicationDraftAction(version)).toEqual({
      ok: true,
      data: published,
    });
    expect(mocks.copy).toHaveBeenCalledTimes(2);
    expect(mocks.copy).toHaveBeenNthCalledWith(
      1,
      fixture.source.path,
      fixture.user.id + "/" + fixture.modelId + "/sofa.obj",
      { destinationBucket: "models" },
    );
    expect(mocks.rpc).toHaveBeenLastCalledWith("manage_publication_draft", {
      requested_draft_id: id.draftId,
      requested_operation: "finish_publish",
    });
  });
  it("reconciles a published draft without copying another model", async () => {
    mocks.rpcSingle.mockResolvedValueOnce({
      data: publicationRow({
        lifecycle: "published",
        model_id: fixture.modelId,
      }),
      error: null,
    });
    expect((await publishPublicationDraftAction(version)).ok).toBe(true);
    expect(mocks.copy).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it("keeps the frozen publication retryable on a copy error", async () => {
    mocks.rpcSingle.mockResolvedValueOnce({
      data: publicationPreparedRow(),
      error: null,
    });
    mocks.copy.mockResolvedValueOnce({
      data: null,
      error: { statusCode: "500", message: "failed" },
    });
    expect(await publishPublicationDraftAction(version)).toEqual({
      ok: false,
      error: "storage_unavailable",
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("uses the same cleanup pipeline for cancellation and deletion", async () => {
    expect((await cancelPublicationDraftAction(version)).ok).toBe(true);
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "manage_publication_draft", {
      requested_draft_id: id.draftId,
      requested_operation: "cancel_publish",
      requested_revision: 0,
    });
    expect(
      (await deletePublicationDraftAction({ ...version, confirmed: true })).ok,
    ).toBe(true);
    expect(mocks.rpc).toHaveBeenNthCalledWith(4, "manage_publication_draft", {
      requested_draft_id: id.draftId,
      requested_operation: "begin_delete",
      requested_revision: 0,
    });
    expect((await cleanupPublicationDraftAction(id)).ok).toBe(true);
  });
});

describe("private draft readers", () => {
  it("returns partial saved metadata without exposing storage pointers", async () => {
    const result = await fetchPublicationDraftAction(id);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected draft");
    expect(result.data.draft).toMatchObject({
      id: fixture.draft.id,
      title_en: "",
      revision: 0,
    });
    expect(result.data.draft).not.toHaveProperty("source_asset_id");
    expect(result.data).toMatchObject({
      source: null,
      cover: null,
      coverUrl: null,
      cleanupPending: false,
    });
    expect(mocks.draftEq).toHaveBeenCalledWith("creator_id", fixture.user.id);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
  it.each([0, 1, 103])(
    "reports published cleanup from the actual remaining asset count %i",
    async (count) => {
      mocks.readSingle.mockResolvedValueOnce({
        data: {
          ...fixture.draft,
          lifecycle: "published",
          publication_model_id: fixture.modelId,
        },
        error: null,
      });
      mocks.assetCountResult.mockResolvedValueOnce({
        data: null,
        count,
        error: null,
      });

      const result = await fetchPublicationDraftAction(id);

      expect(result.ok && result.data.cleanupPending).toBe(count > 0);
      expect(mocks.assetsSelect).toHaveBeenCalledWith("id", {
        count: "exact",
        head: true,
      });
      expect(mocks.assetCountEq).toHaveBeenCalledWith("draft_id", id.draftId);
      expect(mocks.rpc).not.toHaveBeenCalled();
      expect(mocks.remove).not.toHaveBeenCalled();
      expect(JSON.stringify(result)).not.toContain("object_path");
    },
  );
  it.each(["draft", "publishing", "cancelling", "deleting"] as const)(
    "does not claim a server cleanup state for a %s draft",
    async (lifecycle) => {
      mocks.readSingle.mockResolvedValueOnce({
        data: { ...fixture.draft, lifecycle },
        error: null,
      });

      const result = await fetchPublicationDraftAction(id);

      expect(result.ok && result.data.cleanupPending).toBe(false);
      expect(mocks.assetCountResult).not.toHaveBeenCalled();
    },
  );
  it.each([
    null,
    undefined,
    -1,
    0.5,
    Number.MAX_SAFE_INTEGER + 1,
    NaN,
    Infinity,
    "2",
  ])(
    "rejects an invalid published asset count %s instead of claiming cleanup",
    async (count) => {
      mocks.readSingle.mockResolvedValueOnce({
        data: {
          ...fixture.draft,
          lifecycle: "published",
          publication_model_id: fixture.modelId,
        },
        error: null,
      });
      mocks.assetCountResult.mockResolvedValueOnce({
        data: null,
        count,
        error: null,
      });

      expect(await fetchPublicationDraftAction(id)).toEqual({
        ok: false,
        error: "generic",
      });
    },
  );
  it("preserves a published asset-count failure instead of reporting clean state", async () => {
    mocks.readSingle.mockResolvedValueOnce({
      data: {
        ...fixture.draft,
        lifecycle: "published",
        publication_model_id: fixture.modelId,
      },
      error: null,
    });
    mocks.assetCountResult.mockResolvedValueOnce({
      data: null,
      count: 0,
      error: { message: "storage metadata unavailable" },
    });

    expect(await fetchPublicationDraftAction(id)).toEqual({
      ok: false,
      error: "generic",
    });
  });
  it("rejects a foreign published draft before checking its asset count", async () => {
    mocks.readSingle.mockResolvedValueOnce({
      data: {
        ...fixture.draft,
        creator_id: fixture.modelId,
        lifecycle: "published",
        publication_model_id: fixture.modelId,
      },
      error: null,
    });

    expect(await fetchPublicationDraftAction(id)).toEqual({
      ok: false,
      error: "generic",
    });
    expect(mocks.assetCountResult).not.toHaveBeenCalled();
    expect(mocks.assetsSelect).not.toHaveBeenCalled();
  });
  it("signs a private cover briefly and returns minimal file summaries", async () => {
    mocks.readSingle.mockResolvedValueOnce({
      data: { ...fixture.draft, cover_asset_id: fixture.cover.id },
      error: null,
    });
    mocks.assetsResult.mockResolvedValueOnce({
      data: [publicationStoredAsset(fixture.cover)],
      error: null,
    });
    const result = await fetchPublicationDraftAction(id);
    expect(result.ok && result.data.cover).toEqual({
      id: fixture.cover.id,
      kind: "cover",
      name: "cover.png",
      size: 7,
      extension: "png",
    });
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(fixture.cover.path, 60);
  });
  it.each([
    { data: null, error: null, expected: "draft_unavailable" },
    { data: null, error: { message: "db unavailable" }, expected: "generic" },
  ])(
    "distinguishes missing rows from errors %j",
    async ({ data, error, expected }) => {
      mocks.readSingle.mockResolvedValueOnce({ data, error });
      expect(await fetchPublicationDraftAction(id)).toEqual({
        ok: false,
        error: expected,
      });
    },
  );
  it("rejects foreign rows and mismatched active assets", async () => {
    mocks.readSingle.mockResolvedValueOnce({
      data: { ...fixture.draft, creator_id: fixture.modelId },
      error: null,
    });
    expect(await fetchPublicationDraftAction(id)).toEqual({
      ok: false,
      error: "generic",
    });
    mocks.assetsResult.mockResolvedValueOnce({
      data: [publicationStoredAsset(fixture.cover)],
      error: null,
    });
    expect(await fetchPublicationDraftAction(id)).toEqual({
      ok: false,
      error: "generic",
    });
    expect(mocks.createSignedUrl).not.toHaveBeenCalled();
  });
  it("uses a stable bounded list and clamps a removed last page", async () => {
    mocks.countResult.mockResolvedValueOnce({ count: 6, error: null });
    expect(await fetchPublicationDraftsPageAction({ page: 99 })).toMatchObject({
      ok: true,
      data: { totalCount: 6, totalPages: 2, currentPage: 2 },
    });
    expect(mocks.range).toHaveBeenCalledWith(5, 9);
    expect(mocks.countNeq).toHaveBeenCalledWith("lifecycle", "published");
    expect(mocks.draftNeq).toHaveBeenCalledWith("lifecycle", "published");
    expect(mocks.order).toHaveBeenNthCalledWith(1, "updated_at", {
      ascending: false,
    });
    expect(mocks.order).toHaveBeenNthCalledWith(2, "id", { ascending: true });
  });
  it("separates a valid empty account from failed counts", async () => {
    mocks.countResult.mockResolvedValueOnce({ count: 0, error: null });
    mocks.listResult.mockResolvedValueOnce({ data: [], error: null });
    expect(await fetchPublicationDraftsPageAction()).toEqual({
      ok: true,
      data: { drafts: [], totalCount: 0, currentPage: 1, totalPages: 1 },
    });
    mocks.countResult.mockResolvedValueOnce({ count: null, error: null });
    expect(await fetchPublicationDraftsPageAction()).toEqual({
      ok: false,
      error: "generic",
    });
  });
  it("recounts only once on a concurrent count/range mismatch", async () => {
    mocks.countResult.mockResolvedValue({ count: 2, error: null });
    expect(await fetchPublicationDraftsPageAction()).toEqual({
      ok: false,
      error: "generic",
    });
    expect(mocks.countResult).toHaveBeenCalledTimes(2);
  });
  it("rejects a completed publication returned in the unfinished-draft list", async () => {
    mocks.listResult.mockResolvedValueOnce({
      data: [
        {
          ...fixture.draft,
          lifecycle: "published",
          publication_model_id: fixture.modelId,
        },
      ],
      error: null,
    });
    expect(await fetchPublicationDraftsPageAction()).toEqual({
      ok: false,
      error: "generic",
    });
  });
});
