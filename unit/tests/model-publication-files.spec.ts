import { PUBLICATION_REQUEST_TIMEOUT_MS } from "@/src/business/constants/modelPublication";
import {
  cleanPublicationFiles,
  copyPublicationFiles,
  managePublication,
  signPublicationCover,
  withPublicationClient,
} from "@/src/business/utils/supabase/modelPublicationFiles";
import { vi } from "vitest";
import { afterEach, beforeEach, describe, expect, it } from "../fixtures";
import {
  publicationFixture as fixture,
  publicationMocks as mocks,
  publicationDeferred,
  publicationPreparedRow,
  publicationRow,
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
const manage = () =>
  withPublicationClient((context) =>
    managePublication(context, {
      requested_draft_id: fixture.draft.id,
      requested_operation: "cleanup",
    }),
  );
const cleanup = () =>
  withPublicationClient((context) =>
    cleanPublicationFiles(context, fixture.draft.id),
  );
const copy = () =>
  withPublicationClient(
    async (context) =>
      (await copyPublicationFiles(
        context,
        publicationPreparedRow().assets,
      )) ?? { ok: true, data: "copied" },
  );
beforeEach(() => {
  resetPublicationMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55321");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("publication Storage boundary", () => {
  it.each([
    { draft_id: fixture.modelId },
    { result: "unexpected" },
    { assets: [fixture.source, fixture.source] },
    {
      objects: [
        {
          bucket: "models",
          path: fixture.user.id + "/" + fixture.modelId + "/../other.obj",
        },
      ],
      model_id: fixture.modelId,
    },
    {
      objects: [
        {
          bucket: "model-draft-files",
          path: fixture.user.id + "/" + fixture.modelId + "/source.obj",
        },
      ],
    },
  ])(
    "rejects malformed or unsafe RPC rows before Storage %j",
    async (override) => {
      mocks.rpcSingle.mockResolvedValueOnce({
        data: { ...publicationRow(), ...override },
        error: null,
      });
      expect((await manage()).ok).toBe(false);
      expect(mocks.remove).not.toHaveBeenCalled();
      expect(mocks.copy).not.toHaveBeenCalled();
    },
  );
  it("removes only validated paths and finalizes after both buckets succeed", async () => {
    mocks.rpcSingle.mockResolvedValueOnce({
      data: publicationRow({
        objects: [
          { bucket: fixture.source.bucket, path: fixture.source.path },
          { bucket: fixture.cover.bucket, path: fixture.cover.path },
        ],
      }),
      error: null,
    });
    expect((await cleanup()).ok).toBe(true);
    expect(mocks.remove).toHaveBeenNthCalledWith(1, [fixture.source.path]);
    expect(mocks.remove).toHaveBeenNthCalledWith(2, [fixture.cover.path]);
    expect(mocks.rpc).toHaveBeenLastCalledWith("manage_publication_draft", {
      requested_draft_id: fixture.draft.id,
      requested_operation: "finish_cleanup",
    });
  });
  it("does not finalize after a partial Storage failure", async () => {
    mocks.rpcSingle.mockResolvedValueOnce({
      data: publicationRow({
        objects: [{ bucket: fixture.source.bucket, path: fixture.source.path }],
      }),
      error: null,
    });
    mocks.remove.mockResolvedValueOnce({
      data: null,
      error: { message: "failed" },
    });
    expect(await cleanup()).toEqual({ ok: false, error: "cleanup_incomplete" });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it("does not turn a pending tombstone into success", async () => {
    mocks.rpcSingle
      .mockResolvedValueOnce({ data: publicationRow(), error: null })
      .mockResolvedValueOnce({
        data: publicationRow({ result: "cleanup_incomplete" }),
        error: null,
      });
    expect(await cleanup()).toEqual({ ok: false, error: "cleanup_incomplete" });
  });
  it("does not continue after a timed-out removal completes late", async () => {
    vi.useFakeTimers();
    const late = publicationDeferred<{ data: []; error: null }>();
    mocks.rpcSingle.mockResolvedValueOnce({
      data: publicationRow({
        objects: [{ bucket: fixture.source.bucket, path: fixture.source.path }],
      }),
      error: null,
    });
    mocks.remove.mockReturnValueOnce(late.promise);
    const pending = cleanup();
    await vi.advanceTimersByTimeAsync(PUBLICATION_REQUEST_TIMEOUT_MS + 1);
    expect(await pending).toEqual({ ok: false, error: "timeout" });
    late.resolve({ data: [], error: null });
    await Promise.resolve();
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalled();
  });
  it("allows a repeated copy conflict to reach authoritative final validation", async () => {
    mocks.copy.mockResolvedValueOnce({
      data: null,
      error: { statusCode: "409", message: "already exists" },
    });
    expect(await copy()).toEqual({ ok: true, data: "copied" });
    expect(mocks.copy).toHaveBeenCalledTimes(2);
  });
  it("requires two active distinct kinds before any copy", async () => {
    const result = await withPublicationClient(
      async (context) =>
        (await copyPublicationFiles(context, [fixture.source])) ?? {
          ok: true,
          data: "copied",
        },
    );
    expect(result).toEqual({ ok: false, error: "storage_unavailable" });
    expect(mocks.copy).not.toHaveBeenCalled();
  });
  it.each([
    "https://evil.example/storage/v1/object/sign/model-draft-images/a?token=x",
    "http://127.0.0.1:55321/storage/v1/object/sign/model-draft-images/foreign?token=x",
    "http://127.0.0.1:55321/storage/v1/object/sign/model-draft-images/cover.png",
  ])("rejects an unexpected signed-cover URL %s", async (signedUrl) => {
    mocks.createSignedUrl.mockResolvedValueOnce({
      data: { signedUrl },
      error: null,
    });
    expect(
      await withPublicationClient((context) =>
        signPublicationCover(context, fixture.cover),
      ),
    ).toEqual({ ok: false, error: "storage_unavailable" });
  });
  it("reports unavailable cover bytes without returning a fake public URL", async () => {
    mocks.createSignedUrl.mockResolvedValueOnce({
      data: null,
      error: { message: "missing" },
    });
    expect(
      await withPublicationClient((context) =>
        signPublicationCover(context, fixture.cover),
      ),
    ).toEqual({ ok: false, error: "file_unavailable" });
  });
});
