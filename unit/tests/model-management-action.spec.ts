import {
  deleteOwnedModelAction,
  fetchOwnedModelAction,
  fetchOwnedModelsPageAction,
  setOwnedModelPublicationAction,
  updateOwnedModelAction,
} from "@/src/app/[locale]/(main-pages)/profile/uploads/management-actions";
import {
  modelManagementRevalidationPaths,
  modelManagementRpcResults,
} from "@/src/business/constants/modelManagement";
import { redirect } from "next/navigation";
import { vi } from "vitest";
import { afterEach, beforeEach, describe, expect, it } from "../fixtures";
import {
  deferredModelManagementResponse,
  modelManagementFixture as fixture,
  modelManagementMocks as mocks,
  queueModelCleanup,
  resetModelManagementMocks,
} from "../mocks/model-management";

vi.mock("@/src/business/utils/supabase/server", async () => {
  const { modelManagementMocks } = await import("../mocks/model-management");
  return { createClient: modelManagementMocks.createClient };
});
vi.mock("next/cache", async () => {
  const { modelManagementMocks } = await import("../mocks/model-management");
  return { revalidatePath: modelManagementMocks.revalidatePath };
});

const update = () =>
  updateOwnedModelAction("ua", {
    modelId: fixture.model.id,
    metadata: fixture.metadata,
  });
const removeModel = () =>
  deleteOwnedModelAction("en", { modelId: fixture.model.id, confirmed: true });
beforeEach(resetModelManagementMocks);
afterEach(() => vi.useRealTimers());

describe("owned model page read", () => {
  it("returns validated own rows, permission and categories without private fields", async () => {
    mocks.listResult.mockResolvedValueOnce({
      data: [{ ...fixture.listRow, object_path: "private" }],
      error: null,
    });
    expect(await fetchOwnedModelsPageAction()).toEqual({
      ok: true,
      page: {
        profileId: fixture.user.id,
        canUpload: true,
        models: [fixture.listRow],
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
        categoryGroups: fixture.categoryGroups,
      },
    });
    expect(mocks.countEq).toHaveBeenCalledWith("creator_id", fixture.user.id);
    expect(mocks.modelEq).toHaveBeenCalledWith("creator_id", fixture.user.id);
    expect(mocks.order).toHaveBeenNthCalledWith(1, "created_at", {
      ascending: false,
    });
    expect(mocks.order).toHaveBeenNthCalledWith(2, "id", { ascending: true });
    expect(mocks.range).toHaveBeenCalledWith(0, 4);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
  it("clamps a removed last page and includes the full count", async () => {
    mocks.countResult.mockResolvedValueOnce({ count: 6, error: null });
    const result = await fetchOwnedModelsPageAction({ page: "99" });
    expect(result.ok && result.page).toMatchObject({
      currentPage: 2,
      totalPages: 2,
      totalCount: 6,
    });
    expect(mocks.range).toHaveBeenCalledWith(5, 9);
  });
  it.each(
    ["bad", "0", "-1", ["2"], 0, 1.5, "999999999999999999999"].map((page) => ({
      page,
    })),
  )("normalizes invalid page %j", async ({ page }) => {
    expect((await fetchOwnedModelsPageAction({ page })).ok).toBe(true);
    expect(mocks.range).toHaveBeenCalledWith(0, 4);
  });
  it("returns a real empty state without a rows request", async () => {
    mocks.countResult.mockResolvedValueOnce({ count: 0, error: null });
    expect(await fetchOwnedModelsPageAction()).toMatchObject({
      ok: true,
      page: { models: [], totalCount: 0, totalPages: 1 },
    });
    expect(mocks.listResult).not.toHaveBeenCalled();
  });
  it("recounts once when a concurrent deletion changes the range", async () => {
    mocks.countResult.mockResolvedValueOnce({ count: 6, error: null });
    mocks.listResult.mockResolvedValueOnce({ data: [], error: null });
    const result = await fetchOwnedModelsPageAction({ page: 2 });
    expect(result).toMatchObject({
      ok: true,
      page: { currentPage: 1, totalCount: 1 },
    });
    expect(mocks.countResult).toHaveBeenCalledTimes(2);
    expect(mocks.range.mock.calls).toEqual([
      [5, 9],
      [0, 4],
    ]);
  });
  it("does not turn repeated count/list inconsistency into an empty page", async () => {
    mocks.listResult.mockResolvedValue({ data: [], error: null });
    expect(await fetchOwnedModelsPageAction()).toEqual({
      ok: false,
      error: "generic",
    });
    expect(mocks.countResult).toHaveBeenCalledTimes(2);
  });
  it.each([
    {
      data: [
        {
          ...fixture.listRow,
          creator_id: "00000000-0000-0000-0000-00000000a902",
        },
      ],
    },
    { data: [{ ...fixture.listRow, deletion_pending: true }] },
    { data: [{ ...fixture.listRow, file_size_bytes: -1 }] },
    { data: [fixture.listRow, fixture.listRow] },
  ])("rejects malformed or foreign rows %j", async ({ data }) => {
    mocks.listResult.mockResolvedValueOnce({ data, error: null });
    expect(await fetchOwnedModelsPageAction()).toEqual({
      ok: false,
      error: "generic",
    });
  });
  it.each([null, -1, 1.2, Number.MAX_SAFE_INTEGER + 1])(
    "rejects an invalid count %j",
    async (count) => {
      mocks.countResult.mockResolvedValueOnce({ count, error: null });
      expect(await fetchOwnedModelsPageAction()).toEqual({
        ok: false,
        error: "generic",
      });
    },
  );
  it.each([
    null,
    { ...fixture.profile, id: fixture.model.id },
    { ...fixture.profile, can_upload: "yes" },
  ])("rejects an unavailable or inconsistent profile %j", async (data) => {
    mocks.profileSingle.mockResolvedValueOnce({ data, error: null });
    expect(await fetchOwnedModelsPageAction()).toEqual({
      ok: false,
      error: "generic",
    });
    expect(mocks.countResult).not.toHaveBeenCalled();
  });
  it("preserves management when categories fail, without inventing category options", async () => {
    mocks.categoriesResult.mockResolvedValueOnce({
      data: null,
      error: { message: "private" },
    });
    expect(await fetchOwnedModelsPageAction()).toMatchObject({
      ok: true,
      page: { categoryGroups: null, totalCount: 1 },
    });
  });
  it("returns a safe failure for a failed rows request", async () => {
    mocks.listResult.mockResolvedValueOnce({
      data: null,
      error: { message: "private" },
    });
    expect(await fetchOwnedModelsPageAction()).toEqual({
      ok: false,
      error: "generic",
    });
  });
  it("authenticates before reading private lists", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    expect(await fetchOwnedModelsPageAction()).toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("bounds list reads by the shared deadline", async () => {
    vi.useFakeTimers();
    mocks.listResult.mockReturnValueOnce(new Promise(() => {}));
    const request = fetchOwnedModelsPageAction();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await request).toEqual({ ok: false, error: "timeout" });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("owned model read", () => {
  it("returns only validated editor fields with both model and owner filters", async () => {
    mocks.readSingle.mockResolvedValueOnce({
      data: { ...fixture.model, object_path: "private", can_upload: true },
      error: null,
    });
    expect(await fetchOwnedModelAction({ modelId: fixture.model.id })).toEqual({
      ok: true,
      model: fixture.model,
    });
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("models");
    expect(mocks.modelEq).toHaveBeenNthCalledWith(1, "id", fixture.model.id);
    expect(mocks.modelEq).toHaveBeenNthCalledWith(
      2,
      "creator_id",
      fixture.user.id,
    );
    expect(mocks.select).not.toHaveBeenCalledWith(
      expect.stringContaining("object_path"),
    );
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
  it("distinguishes missing models from failed reads", async () => {
    mocks.readSingle.mockResolvedValueOnce({ data: null, error: null });
    expect(await fetchOwnedModelAction({ modelId: fixture.model.id })).toEqual({
      ok: false,
      error: "model_unavailable",
    });
    mocks.readSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "private SQL error" },
    });
    expect(await fetchOwnedModelAction({ modelId: fixture.model.id })).toEqual({
      ok: false,
      error: "generic",
    });
  });
  it.each([
    { creator_id: "00000000-0000-0000-0000-00000000a902" },
    { id: "00000000-0000-0000-0000-00000000a922" },
    { deletion_pending: true },
    { status: "invented" },
    { title_ua: 7 },
  ])("rejects an inconsistent model response %j", async (override) => {
    mocks.readSingle.mockResolvedValueOnce({
      data: { ...fixture.model, ...override },
      error: null,
    });
    expect(await fetchOwnedModelAction({ modelId: fixture.model.id })).toEqual({
      ok: false,
      error: "generic",
    });
  });
  it("can read an archived pending model for retry UI", async () => {
    mocks.readSingle.mockResolvedValueOnce({
      data: { ...fixture.model, status: "archived", deletion_pending: true },
      error: null,
    });
    expect(
      await fetchOwnedModelAction({ modelId: fixture.model.id }),
    ).toMatchObject({ ok: true, model: { deletion_pending: true } });
  });
});

describe("input and authentication boundaries", () => {
  it("rejects invalid requests before constructing a client", async () => {
    const expected = { ok: false, error: "invalid_request" };
    expect(await fetchOwnedModelAction({ modelId: "invalid" })).toEqual(
      expected,
    );
    expect(
      await updateOwnedModelAction("pl", {
        modelId: fixture.model.id,
        metadata: fixture.metadata,
      }),
    ).toEqual(expected);
    expect(
      await updateOwnedModelAction("ua", {
        modelId: fixture.model.id,
        metadata: { ...fixture.metadata, creatorId: fixture.user.id },
      }),
    ).toEqual(expected);
    expect(
      await setOwnedModelPublicationAction("en", {
        modelId: fixture.model.id,
        status: "draft",
      }),
    ).toEqual(expected);
    expect(
      await deleteOwnedModelAction("ua", { modelId: fixture.model.id }),
    ).toEqual(expected);
    expect(
      await deleteOwnedModelAction("ua", {
        modelId: fixture.model.id,
        confirmed: false,
      }),
    ).toEqual(expected);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it("rejects guests before reading, writing or deleting files", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    expect(await removeModel()).toEqual({ ok: false, error: "unauthorized" });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it.each([400, 401, 403, 500])(
    "maps Auth HTTP %i without leaking errors",
    async (status) => {
      mocks.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { status, message: "private details" },
      });
      expect(await update()).toEqual({
        ok: false,
        error: status === 500 ? "generic" : "unauthorized",
      });
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it("rejects malformed identity", async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: { user: { ...fixture.user, id: "invalid" } },
      error: null,
    });
    expect(await update()).toEqual({ ok: false, error: "generic" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("handles rejected client and Auth requests", async () => {
    mocks.createClient.mockRejectedValueOnce(new Error("configuration"));
    expect(await update()).toEqual({ ok: false, error: "generic" });
    mocks.getUser.mockRejectedValueOnce(new Error("Auth offline"));
    expect(await update()).toEqual({ ok: false, error: "generic" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rethrows actual Next.js control-flow errors", async () => {
    expect.assertions(2);
    try {
      redirect("/en/login");
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      mocks.createClient.mockRejectedValueOnce(error);
      await expect(update()).rejects.toBe(error);
      expect(mocks.rpc).not.toHaveBeenCalled();
    }
  });
});

describe("metadata and publication writes", () => {
  it("saves only the whitelist through the current user's RPC", async () => {
    expect(await update()).toEqual({ ok: true, modelId: fixture.model.id });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("manage_owned_model", {
      requested_model_id: fixture.model.id,
      requested_operation: "update",
      requested_metadata: fixture.metadata,
    });
    expect(mocks.rpcAbort).toHaveBeenCalledWith(expect.any(AbortSignal));
    for (const path of modelManagementRevalidationPaths)
      expect(mocks.revalidatePath).toHaveBeenCalledWith(path, "page");
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });
  it.each([
    ["published", "publish"],
    ["archived", "archive"],
  ] as const)("maps %s to explicit %s intent", async (status, operation) => {
    expect(
      await setOwnedModelPublicationAction("en", {
        modelId: fixture.model.id,
        status,
      }),
    ).toEqual({ ok: true, modelId: fixture.model.id });
    expect(mocks.rpc).toHaveBeenCalledWith("manage_owned_model", {
      requested_model_id: fixture.model.id,
      requested_operation: operation,
    });
  });
  it.each(modelManagementRpcResults.filter((result) => result !== "ok"))(
    "returns typed %s failures",
    async (result) => {
      mocks.rpcSingle.mockResolvedValueOnce({
        data: { ...fixture.row, result },
        error: null,
      });
      expect(await update()).toEqual({ ok: false, error: result });
      expect(mocks.remove).not.toHaveBeenCalled();
    },
  );
  it.each([
    null,
    { ...fixture.row, result: "unknown" },
    { ...fixture.row, model_id: "00000000-0000-0000-0000-00000000a922" },
    { ...fixture.row, image_paths: fixture.imagePaths },
  ])("rejects malformed or inconsistent RPC data %j", async (data) => {
    mocks.rpcSingle.mockResolvedValueOnce({ data, error: null });
    expect(await update()).toEqual({ ok: false, error: "generic" });
  });
  it("handles database errors without exposing details", async () => {
    mocks.rpcSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "SQL detail" },
    });
    expect(await update()).toEqual({ ok: false, error: "generic" });
    mocks.rpcSingle.mockRejectedValueOnce(new Error("network"));
    expect(await update()).toEqual({ ok: false, error: "generic" });
  });
});

describe("durable cleanup", () => {
  it("begins deletion before removing files and finalizes only afterward", async () => {
    queueModelCleanup();
    expect(await removeModel()).toEqual({
      ok: true,
      modelId: fixture.model.id,
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "manage_owned_model", {
      requested_model_id: fixture.model.id,
      requested_operation: "begin_delete",
    });
    expect(mocks.storageFrom).toHaveBeenNthCalledWith(1, "models");
    expect(mocks.remove).toHaveBeenNthCalledWith(1, fixture.modelPaths);
    expect(mocks.storageFrom).toHaveBeenNthCalledWith(2, "model-images");
    expect(mocks.remove).toHaveBeenNthCalledWith(2, fixture.imagePaths);
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, "manage_owned_model", {
      requested_model_id: fixture.model.id,
      requested_operation: "finish_delete",
    });
    expect(mocks.rpc.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.remove.mock.invocationCallOrder[0],
    );
    expect(mocks.remove.mock.invocationCallOrder[1]).toBeLessThan(
      mocks.rpc.mock.invocationCallOrder[1],
    );
  });
  it("finishes an already empty pending folder without Storage calls", async () => {
    expect(await removeModel()).toEqual({
      ok: true,
      modelId: fixture.model.id,
    });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });
  it("does not remove files after begin_delete denial", async () => {
    mocks.rpcSingle.mockResolvedValueOnce({
      data: { ...fixture.row, result: "model_unavailable" },
      error: null,
    });
    expect(await removeModel()).toEqual({
      ok: false,
      error: "model_unavailable",
    });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });
  it.each([
    [`00000000-0000-0000-0000-00000000a902/${fixture.model.id}/source.obj`],
    [`${fixture.user.id}/00000000-0000-0000-0000-00000000a922/source.obj`],
    [`${fixture.user.id}/${fixture.model.id}/../foreign.obj`],
  ])(
    "rejects foreign or unsafe cleanup path %s before any Storage call",
    async (path) => {
      mocks.rpcSingle.mockResolvedValueOnce({
        data: {
          ...fixture.row,
          model_paths: [path],
          image_paths: fixture.imagePaths,
        },
        error: null,
      });
      expect(await removeModel()).toEqual({
        ok: false,
        error: "storage_unavailable",
      });
      expect(mocks.storageFrom).not.toHaveBeenCalled();
    },
  );
  it.each([1, 2])("retains metadata when bucket %i fails", async (bucket) => {
    queueModelCleanup();
    if (bucket === 2)
      mocks.remove.mockResolvedValueOnce({ data: [], error: null });
    mocks.remove.mockResolvedValueOnce({
      data: null,
      error: { message: "storage details" },
    });
    expect(await removeModel()).toEqual({
      ok: false,
      error: "cleanup_incomplete",
    });
    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.remove).toHaveBeenCalledTimes(bucket);
  });
  it("supports a retry containing only the files still present", async () => {
    mocks.rpcSingle.mockResolvedValueOnce({
      data: { ...fixture.row, image_paths: fixture.imagePaths },
      error: null,
    });
    expect(await removeModel()).toEqual({
      ok: true,
      modelId: fixture.model.id,
    });
    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(fixture.imagePaths);
  });
  it("does not claim success if more objects remain or deletion RPC fails", async () => {
    queueModelCleanup();
    mocks.rpcSingle.mockResolvedValueOnce({
      data: { ...fixture.row, result: "cleanup_incomplete" },
      error: null,
    });
    expect(await removeModel()).toEqual({
      ok: false,
      error: "cleanup_incomplete",
    });
  });
});

describe("shared deadline and late responses", () => {
  it("uses a single ten-second budget for Auth and RPC", async () => {
    vi.useFakeTimers();
    mocks.getUser.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 9000));
      return { data: { user: fixture.user }, error: null };
    });
    mocks.rpcSingle.mockImplementationOnce(() => new Promise(() => {}));
    const result = update();
    await vi.advanceTimersByTimeAsync(10000);
    expect(await result).toEqual({ ok: false, error: "timeout" });
    expect(mocks.rpcAbort.mock.calls[0][0].aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("does not write after a late Auth result", async () => {
    vi.useFakeTimers();
    const auth = deferredModelManagementResponse<{
      data: { user: typeof fixture.user };
      error: null;
    }>();
    mocks.getUser.mockReturnValueOnce(auth.promise);
    const result = update();
    await vi.advanceTimersByTimeAsync(10000);
    expect(await result).toEqual({ ok: false, error: "timeout" });
    auth.resolve({ data: { user: fixture.user }, error: null });
    await Promise.resolve();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("never finalizes after a slow Storage request times out and later completes", async () => {
    vi.useFakeTimers();
    queueModelCleanup();
    const storage = deferredModelManagementResponse<{
      data: never[];
      error: null;
    }>();
    mocks.remove.mockReturnValueOnce(storage.promise);
    const result = removeModel();
    await vi.advanceTimersByTimeAsync(10000);
    expect(await result).toEqual({ ok: false, error: "timeout" });
    storage.resolve({ data: [], error: null });
    await Promise.resolve();
    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.remove).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("clears the deadline after a fast successful request", async () => {
    vi.useFakeTimers();
    await update();
    expect(vi.getTimerCount()).toBe(0);
  });
});
