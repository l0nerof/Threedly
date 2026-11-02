import { PUBLICATION_UPLOAD_TIMEOUT_MS } from "@/src/business/constants/modelPublication";
import { uploadPublicationAsset } from "@/src/business/utils/modelPublicationUpload";
import { vi } from "vitest";
import { afterEach, beforeEach, describe, expect, it } from "../fixtures";
import {
  publicationFixture as fixture,
  publicationMocks as mocks,
  publicationDeferred,
  publicationRow,
  resetPublicationMocks,
} from "../mocks/model-publication";

vi.mock("@/src/business/utils/supabase/client", async () => ({
  createClient: (await import("../mocks/model-publication")).publicationMocks
    .browserClient,
}));
const input = () => ({
  userId: fixture.user.id,
  draftId: fixture.draft.id,
  revision: 0,
  kind: fixture.source.kind,
  file: new File(["12345"], "Sofa.OBJ"),
  reserve: mocks.reserve,
  attach: mocks.attach,
});
beforeEach(resetPublicationMocks);
afterEach(() => vi.useRealTimers());

describe("authenticated publication transfer", () => {
  it("uploads directly to the reserved private path and attaches after confirmation", async () => {
    const request = input();
    expect(await uploadPublicationAsset(request)).toEqual({
      ok: true,
      data: publicationRow({ revision: 1 }),
    });
    expect(mocks.upload).toHaveBeenCalledWith(
      fixture.source.path,
      request.file,
      {
        upsert: false,
        contentType: "application/octet-stream",
        cacheControl: "0",
      },
    );
    expect(mocks.attach).toHaveBeenCalledWith({
      draftId: fixture.draft.id,
      revision: 0,
      assetId: fixture.source.id,
    });
    expect(mocks.getUser).toHaveBeenCalledTimes(2);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("rejects unsupported files before creating a client or reservation", async () => {
    expect(
      await uploadPublicationAsset({
        ...input(),
        file: new File(["12345"], "script.exe"),
      }),
    ).toEqual({ ok: false, error: "invalid_request" });
    expect(mocks.browserClient).not.toHaveBeenCalled();
  });
  it("uploads one supported cover through its private bucket", async () => {
    mocks.reserve.mockResolvedValueOnce({
      ok: true,
      data: publicationRow({
        assets: [{ ...fixture.cover, state: "reserved" }],
      }),
    });
    expect(
      (
        await uploadPublicationAsset({
          ...input(),
          kind: "cover",
          file: new File(["1234567"], "cover.png", { type: "image/png" }),
        })
      ).ok,
    ).toBe(true);
    expect(mocks.storageFrom).toHaveBeenCalledWith("model-draft-images");
  });
  it.each(["unauthorized", "session_changed"] as const)(
    "rejects %s before reserving a file",
    async (error) => {
      mocks.getUser.mockResolvedValueOnce({
        data: {
          user:
            error === "unauthorized"
              ? null
              : { ...fixture.user, id: fixture.modelId },
        },
        error: null,
      });
      expect(await uploadPublicationAsset(input())).toEqual({
        ok: false,
        error,
      });
      expect(mocks.reserve).not.toHaveBeenCalled();
    },
  );
  it("preserves server conflict responses without writing bytes", async () => {
    mocks.reserve.mockResolvedValueOnce({ ok: false, error: "conflict" });
    expect(await uploadPublicationAsset(input())).toEqual({
      ok: false,
      error: "conflict",
    });
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it.each([
    { path: "foreign/source.obj" },
    { state: "active" },
    { name: "different.obj" },
    { size: 6 },
    { bucket: "model-draft-images" },
  ])(
    "rejects a reservation that does not match the selected file %j",
    async (override) => {
      mocks.reserve.mockResolvedValueOnce({
        ok: true,
        data: {
          ...publicationRow(),
          assets: [{ ...fixture.source, ...override }],
        },
      });
      expect(await uploadPublicationAsset(input())).toEqual({
        ok: false,
        error: "storage_unavailable",
      });
      expect(mocks.upload).not.toHaveBeenCalled();
    },
  );
  it("does not attach on a Storage failure or delete the existing active file", async () => {
    mocks.upload.mockResolvedValueOnce({
      data: null,
      error: { statusCode: "500" },
    });
    expect(await uploadPublicationAsset(input())).toEqual({
      ok: false,
      error: "storage_unavailable",
    });
    expect(mocks.attach).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("rechecks the live account before attaching completed bytes", async () => {
    mocks.getUser
      .mockResolvedValueOnce({ data: { user: fixture.user }, error: null })
      .mockResolvedValueOnce({
        data: { user: { ...fixture.user, id: fixture.modelId } },
        error: null,
      });
    expect(await uploadPublicationAsset(input())).toEqual({
      ok: false,
      error: "session_changed",
    });
    expect(mocks.attach).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("keeps a completed upload unattached when another tab changed the draft", async () => {
    mocks.attach.mockResolvedValueOnce({ ok: false, error: "conflict" });
    expect(await uploadPublicationAsset(input())).toEqual({
      ok: false,
      error: "conflict",
    });
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("does not start from an already aborted signal", async () => {
    const controller = new AbortController();
    controller.abort();
    expect(
      await uploadPublicationAsset({ ...input(), signal: controller.signal }),
    ).toEqual({ ok: false, error: "timeout" });
    expect(mocks.browserClient).not.toHaveBeenCalled();
  });
  it("bounds an upload and ignores a late Storage response", async () => {
    vi.useFakeTimers();
    const late = publicationDeferred<{ data: null; error: null }>();
    mocks.upload.mockReturnValueOnce(late.promise);
    const pending = uploadPublicationAsset(input());
    await vi.advanceTimersByTimeAsync(PUBLICATION_UPLOAD_TIMEOUT_MS + 1);
    expect(await pending).toEqual({ ok: false, error: "timeout" });
    late.resolve({ data: null, error: null });
    await Promise.resolve();
    expect(mocks.attach).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("honors external cancellation before starting an upload from a late reservation", async () => {
    const controller = new AbortController();
    const pendingReservation =
      publicationDeferred<Awaited<ReturnType<typeof uploadPublicationAsset>>>();
    mocks.reserve.mockReturnValueOnce(pendingReservation.promise);
    const pending = uploadPublicationAsset({
      ...input(),
      signal: controller.signal,
    });
    await Promise.resolve();
    controller.abort();
    expect(await pending).toEqual({ ok: false, error: "timeout" });
    pendingReservation.resolve({
      ok: true,
      data: publicationRow({ assets: [fixture.source] }),
    });
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
