import {
  modelManagementDeleteSchema,
  modelManagementMetadataSchema,
  modelManagementRpcRowSchema,
  modelManagementUpdateSchema,
  ownedModelRowSchema,
} from "@/src/business/schemas/modelManagement";
import {
  awaitModelManagementRequest,
  isOwnedModelStoragePath,
} from "@/src/business/utils/modelManagement";
import { afterEach, describe, expect, it, vi } from "../fixtures";
import {
  deferredModelManagementResponse,
  modelManagementFixture as fixture,
} from "../mocks/model-management";

afterEach(() => vi.useRealTimers());

describe("model management boundaries", () => {
  it("normalizes metadata using the existing upload limits", () => {
    expect(
      modelManagementMetadataSchema.parse({
        ...fixture.metadata,
        titleUa: "  Назва  ",
        descriptionEn: "  ",
      }),
    ).toMatchObject({ titleUa: "Назва", descriptionEn: null });
  });

  it.each([
    { titleUa: "A" },
    { titleEn: "x".repeat(91) },
    { descriptionUa: "x".repeat(601) },
    { descriptionEn: 5 },
    { categoryId: "chairs" },
    { minimumPlan: "enterprise" },
    { slug: "overwrite" },
  ])("rejects invalid metadata or extra fields %j", (override) => {
    expect(
      modelManagementMetadataSchema.safeParse({
        ...fixture.metadata,
        ...override,
      }).success,
    ).toBe(false);
  });

  it("rejects missing confirmation and unexpected update fields", () => {
    expect(
      modelManagementDeleteSchema.safeParse({ modelId: fixture.model.id })
        .success,
    ).toBe(false);
    expect(
      modelManagementDeleteSchema.safeParse({
        modelId: fixture.model.id,
        confirmed: false,
      }).success,
    ).toBe(false);
    expect(
      modelManagementUpdateSchema.safeParse({
        modelId: fixture.model.id,
        metadata: fixture.metadata,
        userId: fixture.user.id,
      }).success,
    ).toBe(false);
  });

  it("normalizes UUID case and strips extra server response data", () => {
    expect(
      modelManagementUpdateSchema.parse({
        modelId: fixture.model.id.toUpperCase(),
        metadata: fixture.metadata,
      }).modelId,
    ).toBe(fixture.model.id);
    expect(
      ownedModelRowSchema.parse({ ...fixture.model, object_path: "private" }),
    ).toEqual(fixture.model);
  });

  it.each([
    { model_paths: ["same", "same"] },
    { model_paths: Array.from({ length: 101 }, (_, i) => `path-${i}`) },
    { result: "ok-but-not-really" },
    { result: "model_unavailable", image_paths: ["private"] },
  ])("rejects malformed RPC output %j", (override) => {
    expect(
      modelManagementRpcRowSchema.safeParse({ ...fixture.row, ...override })
        .success,
    ).toBe(false);
  });

  it("requires pending models to remain archived", () => {
    expect(
      ownedModelRowSchema.safeParse({
        ...fixture.model,
        deletion_pending: true,
      }).success,
    ).toBe(false);
  });
});

describe("scoped cleanup paths", () => {
  it("accepts source, cover and preview paths in exactly the owned model folder", () => {
    for (const path of [...fixture.modelPaths, ...fixture.imagePaths])
      expect(
        isOwnedModelStoragePath(path, fixture.user.id, fixture.model.id),
      ).toBe(true);
  });
  it.each([
    "https://example.test/source.obj",
    "/source.obj",
    "../source.obj",
    "source.obj",
    `${fixture.user.id}/${fixture.model.id}/../foreign.obj`,
    `${fixture.user.id}/${fixture.model.id}/%2e%2e.obj`,
    `${fixture.user.id}/${fixture.model.id}/nested/source.obj`,
    `${fixture.user.id}/${fixture.model.id}/source.obj?download=1`,
    `${fixture.user.id}/${fixture.model.id}/source.obj\n`,
    `${fixture.user.id}/${fixture.model.id}-other/source.obj`,
  ])("rejects unsafe path %s", (path) => {
    expect(
      isOwnedModelStoragePath(path, fixture.user.id, fixture.model.id),
    ).toBe(false);
  });
});

describe("bounded requests", () => {
  it("returns successful data and removes the abort listener", async () => {
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");
    expect(
      await awaitModelManagementRequest(
        Promise.resolve("value"),
        controller.signal,
      ),
    ).toBe("value");
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  });
  it("rejects an already aborted request", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      awaitModelManagementRequest(Promise.resolve("late"), controller.signal),
    ).rejects.toThrow();
  });
  it("ignores a late response after cancellation", async () => {
    const controller = new AbortController();
    const pending = deferredModelManagementResponse<string>();
    const result = awaitModelManagementRequest(
      pending.promise,
      controller.signal,
    );
    const assertion = expect(result).rejects.toThrow();
    controller.abort();
    pending.resolve("late");
    await assertion;
  });
});
