import {
  MAX_MODEL_COVER_IMAGE_SIZE_BYTES,
  MAX_MODEL_UPLOAD_FILE_SIZE_BYTES,
} from "@/src/business/constants/modelUpload";
import {
  publicationDeleteSchema,
  publicationManifestSchema,
  publicationMetadataSchema,
  publicationRpcSchema,
  publicationSaveSchema,
} from "@/src/business/schemas/modelPublication";
import {
  awaitPublicationRequest,
  getPublicationManifest,
  isPublicationAssetPath,
  isPublicationCleanupPath,
} from "@/src/business/utils/modelPublication";
import { afterEach, describe, expect, it, vi } from "../fixtures";
import {
  publicationFixture as fixture,
  publicationDeferred,
  publicationPreparedRow,
  publicationRow,
} from "../mocks/model-publication";

afterEach(() => vi.useRealTimers());
describe("publication boundaries", () => {
  it("allows explicitly saved incomplete metadata without inventing placeholders", () => {
    expect(publicationMetadataSchema.parse(fixture.metadata)).toEqual(
      fixture.metadata,
    );
    expect(
      publicationSaveSchema.parse({
        draftId: fixture.draft.id.toUpperCase(),
        revision: 0,
        metadata: fixture.metadata,
      }).draftId,
    ).toBe(fixture.draft.id);
  });
  it.each([
    { titleUa: "x".repeat(91) },
    { descriptionEn: "x".repeat(601) },
    { categoryId: "chairs" },
    { minimumPlan: "enterprise" },
    { creatorId: fixture.user.id },
  ])("rejects invalid metadata %j", (overrides) => {
    expect(
      publicationMetadataSchema.safeParse({ ...fixture.metadata, ...overrides })
        .success,
    ).toBe(false);
  });
  it("rejects stale-contract inputs and unconfirmed deletion", () => {
    expect(
      publicationSaveSchema.safeParse({
        draftId: fixture.draft.id,
        revision: -1,
        metadata: fixture.metadata,
      }).success,
    ).toBe(false);
    expect(
      publicationDeleteSchema.safeParse({
        draftId: fixture.draft.id,
        revision: 0,
      }).success,
    ).toBe(false);
  });
  it("derives the source manifest and forces a safe binary MIME", () => {
    expect(
      getPublicationManifest(
        new File(["12345"], "Sofa.OBJ", { type: "text/plain" }),
        "source",
      ),
    ).toEqual({
      kind: "source",
      name: "Sofa.OBJ",
      extension: "obj",
      mimeType: "application/octet-stream",
      size: 5,
    });
  });
  it.each(["source.exe", "../source.obj", "nested\\source.obj"])(
    "rejects unsafe file name %s",
    (name) => {
      expect(
        getPublicationManifest(new File(["12345"], name), "source"),
      ).toBeNull();
    },
  );
  it("validates the exact file bounds and permits only supported covers", () => {
    const source = {
      kind: "source",
      name: "a.obj",
      extension: "obj",
      mimeType: "application/octet-stream",
      size: MAX_MODEL_UPLOAD_FILE_SIZE_BYTES,
    };
    expect(publicationManifestSchema.safeParse(source).success).toBe(true);
    expect(
      publicationManifestSchema.safeParse({ ...source, size: source.size + 1 })
        .success,
    ).toBe(false);
    expect(
      publicationManifestSchema.safeParse({
        kind: "cover",
        name: "a.png",
        extension: "png",
        mimeType: "image/png",
        size: MAX_MODEL_COVER_IMAGE_SIZE_BYTES + 1,
      }).success,
    ).toBe(false);
    expect(
      getPublicationManifest(
        new File(["12345"], "a.svg", { type: "image/svg+xml" }),
        "cover",
      ),
    ).toBeNull();
  });
  it("checks canonical private and public destinations", () => {
    expect(
      isPublicationAssetPath(
        fixture.source,
        fixture.user.id,
        fixture.draft.id,
        null,
      ),
    ).toBe(true);
    for (const asset of publicationPreparedRow().assets)
      expect(
        isPublicationAssetPath(
          asset,
          fixture.user.id,
          fixture.draft.id,
          fixture.modelId,
        ),
      ).toBe(true);
    expect(
      isPublicationAssetPath(
        { ...fixture.source, path: fixture.source.path + "/nested" },
        fixture.user.id,
        fixture.draft.id,
        null,
      ),
    ).toBe(false);
    expect(
      isPublicationAssetPath(
        fixture.source,
        fixture.user.id,
        fixture.draft.id,
        fixture.modelId,
      ),
    ).toBe(false);
  });
  it.each([
    "../a.obj",
    "nested/a.obj",
    "%2e%2e.obj",
    "/a.obj",
    "a.obj?token=x",
  ])("rejects unsafe cleanup suffix %s", (suffix) => {
    expect(
      isPublicationCleanupPath(
        {
          bucket: "models",
          path: fixture.user.id + "/" + fixture.modelId + "/" + suffix,
        },
        fixture.user.id,
        fixture.draft.id,
        fixture.modelId,
      ),
    ).toBe(false);
  });
  it("rejects error payloads with assets and oversized RPC arrays", () => {
    expect(
      publicationRpcSchema.safeParse(
        publicationRow({ result: "conflict", assets: [fixture.source] }),
      ).success,
    ).toBe(false);
    expect(
      publicationRpcSchema.safeParse(
        publicationRow({
          assets: [fixture.source, fixture.source, fixture.source],
        }),
      ).success,
    ).toBe(false);
  });
  it("bounds a wait and does not accept a late response after cancellation", async () => {
    const controller = new AbortController();
    const pending = publicationDeferred<string>();
    const waiting = awaitPublicationRequest(pending.promise, controller.signal);
    controller.abort(new Error("cancelled"));
    await expect(waiting).rejects.toThrow("cancelled");
    pending.resolve("late");
    await expect(
      awaitPublicationRequest(Promise.resolve("late"), controller.signal),
    ).rejects.toThrow("cancelled");
  });
});
