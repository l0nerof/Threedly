import { downloadModelAction } from "@/src/app/[locale]/(main-pages)/catalog/download-actions";
import { Constants } from "@/src/business/types/database.generated";
import { buildModelUploadStoragePath } from "@/src/business/utils/modelUpload";
import { vi } from "vitest";
import { afterEach, beforeEach, describe, expect, it } from "../fixtures";
import {
  buildModelDownloadSignedUrl,
  modelDownloadFixture as fixture,
  modelDownloadMocks as mocks,
  resetModelDownloadMocks,
} from "../mocks/model-download";

vi.mock("@/src/business/utils/supabase/server", async () => {
  const { modelDownloadMocks } = await import("../mocks/model-download");
  return { createClient: modelDownloadMocks.createUserClient };
});

vi.mock("@/src/business/utils/supabase/admin", async () => {
  const { modelDownloadMocks } = await import("../mocks/model-download");
  return { createAdminClient: modelDownloadMocks.createAdminClient };
});

const request = { modelId: fixture.model.id };

describe("downloadModelAction", () => {
  beforeEach(() => {
    resetModelDownloadMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", fixture.supabaseUrl);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("prepares a 60-second attachment URL before recording the user's quota", async () => {
    const result = await downloadModelAction(request);
    expect(result).toEqual({
      ok: true,
      url: `${fixture.supabaseUrl}/storage/v1/object/sign/models/${fixture.file.object_path}?token=test-signed-token&download=source.obj`,
    });
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      fixture.file.object_path,
      60,
      { download: true },
    );
    expect(mocks.rpc).toHaveBeenCalledWith("record_model_download", {
      requested_model_id: fixture.model.id,
      requested_file_id: fixture.file.id,
    });
    expect(mocks.createSignedUrl.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.rpc.mock.invocationCallOrder[0],
    );
    expect(mocks.fileQuery.eq).toHaveBeenCalledWith(
      "model_id",
      fixture.model.id,
    );
    expect(mocks.fileQuery.order).toHaveBeenNthCalledWith(1, "is_primary", {
      ascending: false,
    });
    expect(mocks.fileQuery.limit).toHaveBeenCalledWith(1);
    expect(mocks.storageFrom).toHaveBeenCalledWith("models");
  });

  it("scopes a chosen file to both the model and file IDs", async () => {
    expect(
      (await downloadModelAction({ ...request, fileId: fixture.file.id })).ok,
    ).toBe(true);
    expect(mocks.fileQuery.eq.mock.calls).toEqual([
      ["model_id", fixture.model.id],
      ["id", fixture.file.id],
    ]);
  });

  it("encodes the original filename without replacing the signed token", async () => {
    const fileName = "Крісло &token=forged.obj";
    const objectPath = buildModelUploadStoragePath({
      userId: fixture.model.creator_id,
      modelId: fixture.model.id,
      fileName,
    });
    mocks.fileQuery.maybeSingle.mockResolvedValue({
      data: { ...fixture.file, file_name: fileName, object_path: objectPath },
      error: null,
    });
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: buildModelDownloadSignedUrl(objectPath) },
      error: null,
    });
    const result = await downloadModelAction(request);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected a download URL.");
    const url = new URL(result.url);
    expect(url.searchParams.getAll("token")).toEqual(["test-signed-token"]);
    expect(url.searchParams.get("download")).toBe(fileName);
  });

  it.each([
    undefined,
    null,
    {},
    { modelId: "not-an-id" },
    { ...request, fileId: "bad" },
    { ...request, userId: fixture.user.id },
    { ...request, object_path: "foreign.obj" },
  ])(
    "rejects invalid or extra request fields before accessing Supabase: %j",
    async (input) => {
      expect(await downloadModelAction(input)).toEqual({
        ok: false,
        error: "invalidRequest",
      });
      expect(mocks.createUserClient).not.toHaveBeenCalled();
      expect(mocks.createAdminClient).not.toHaveBeenCalled();
    },
  );

  it("rejects guests before accessing privileged metadata", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await downloadModelAction(request)).toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(mocks.userFrom).not.toHaveBeenCalled();
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it.each([400, 401, 403, 500])(
    "handles Auth status %i without signing or recording",
    async (status) => {
      mocks.getUser.mockResolvedValue({
        data: { user: null },
        error: { status, message: "Auth failed" },
      });
      expect(await downloadModelAction(request)).toEqual({
        ok: false,
        error: status === 500 ? "generic" : "unauthorized",
      });
      expect(mocks.createAdminClient).not.toHaveBeenCalled();
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );

  it.each([
    null,
    { ...fixture.profile, id: fixture.model.creator_id },
    { ...fixture.profile, plan_key: "unknown" },
  ])("rejects an absent or invalid profile: %j", async (data) => {
    mocks.profileQuery.maybeSingle.mockResolvedValue({ data, error: null });
    expect(await downloadModelAction(request)).toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it.each([
    null,
    { ...fixture.model, status: "draft" },
    { ...fixture.model, status: "archived" },
    { ...fixture.model, id: fixture.file.id },
  ])("rejects missing, unpublished, or mismatched models: %j", async (data) => {
    mocks.modelQuery.maybeSingle.mockResolvedValue({ data, error: null });
    expect(await downloadModelAction(request)).toEqual({
      ok: false,
      error: "model_unavailable",
    });
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it.each(["pro", "max"] as const)(
    "rejects Free access to %s before signing",
    async (minimum_plan) => {
      mocks.modelQuery.maybeSingle.mockResolvedValue({
        data: { ...fixture.model, minimum_plan },
        error: null,
      });
      expect(await downloadModelAction(request)).toEqual({
        ok: false,
        error: "plan_required",
      });
      expect(mocks.createAdminClient).not.toHaveBeenCalled();
    },
  );

  it("uses the current manually assigned plan", async () => {
    mocks.profileQuery.maybeSingle.mockResolvedValue({
      data: { ...fixture.profile, plan_key: "max" },
      error: null,
    });
    mocks.modelQuery.maybeSingle.mockResolvedValue({
      data: { ...fixture.model, minimum_plan: "pro" },
      error: null,
    });
    expect((await downloadModelAction(request)).ok).toBe(true);
  });

  it.each([
    null,
    { ...fixture.file, model_id: fixture.file.id },
    { ...fixture.file, bucket: "avatars" },
    { ...fixture.file, storage_provider: "r2" },
    { ...fixture.file, object_path: "foreign/model/source.obj" },
    {
      ...fixture.file,
      object_path: `${fixture.model.creator_id}/${fixture.model.id}/../source.obj`,
    },
    {
      ...fixture.file,
      object_path: `${fixture.model.creator_id}/${fixture.model.id}/%2e%2e%2fsource.obj`,
    },
    { ...fixture.file, file_name: "../source.obj" },
    { ...fixture.file, file_name: "source\n.obj" },
  ])(
    "rejects missing or unsafe file metadata before signing: %j",
    async (data) => {
      mocks.fileQuery.maybeSingle.mockResolvedValue({ data, error: null });
      expect(await downloadModelAction(request)).toEqual({
        ok: false,
        error: "file_unavailable",
      });
      expect(mocks.createSignedUrl).not.toHaveBeenCalled();
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );

  it("rejects a missing creator rather than signing a detached source file", async () => {
    mocks.modelQuery.maybeSingle.mockResolvedValue({
      data: { ...fixture.model, creator_id: null },
      error: null,
    });
    expect(await downloadModelAction(request)).toEqual({
      ok: false,
      error: "file_unavailable",
    });
    expect(mocks.createSignedUrl).not.toHaveBeenCalled();
  });

  it("does not substitute another file when a specific ID was requested", async () => {
    expect(
      await downloadModelAction({ ...request, fileId: fixture.model.id }),
    ).toEqual({ ok: false, error: "file_unavailable" });
    expect(mocks.createSignedUrl).not.toHaveBeenCalled();
  });

  it.each(["profile", "model", "file"] as const)(
    "stops on a %s query error",
    async (query) => {
      const queries = {
        profile: mocks.profileQuery,
        model: mocks.modelQuery,
        file: mocks.fileQuery,
      };
      queries[query].maybeSingle.mockResolvedValue({
        data: null,
        error: { message: "Database unavailable" },
      });
      expect(await downloadModelAction(request)).toEqual({
        ok: false,
        error: "generic",
      });
      expect(mocks.createSignedUrl).not.toHaveBeenCalled();
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );

  it("returns a safe error if server credentials are unavailable", async () => {
    mocks.createAdminClient.mockImplementation(() => {
      throw new Error("Missing server credentials");
    });
    expect(await downloadModelAction(request)).toEqual({
      ok: false,
      error: "generic",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each([
    [{ status: 404 }, "file_unavailable"],
    [{ status: 400, statusCode: "404" }, "file_unavailable"],
    [{ status: 403 }, "storageUnavailable"],
    [{ status: 500 }, "storageUnavailable"],
  ])(
    "does not consume quota when signing fails: %j",
    async (error, expectedError) => {
      mocks.createSignedUrl.mockResolvedValue({ data: null, error });
      expect(await downloadModelAction(request)).toEqual({
        ok: false,
        error: expectedError,
      });
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );

  it.each([
    null,
    { signedUrl: "not-a-url" },
    { signedUrl: "https://other.example/file?token=private" },
    { signedUrl: `${fixture.supabaseUrl}/wrong-path?token=private` },
    {
      signedUrl: buildModelDownloadSignedUrl(fixture.file.object_path).replace(
        "token=test-signed-token",
        "token=",
      ),
    },
    {
      signedUrl: `${buildModelDownloadSignedUrl(fixture.file.object_path)}#fragment`,
    },
  ])(
    "rejects an invalid signed URL without recording quota: %j",
    async (data) => {
      mocks.createSignedUrl.mockResolvedValue({ data, error: null });
      expect(await downloadModelAction(request)).toEqual({
        ok: false,
        error: "storageUnavailable",
      });
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );

  it.each(
    Constants.public.Enums.model_download_status.filter(
      (status) => status !== "ok",
    ),
  )(
    "does not expose the prepared URL when the RPC returns %s",
    async (status) => {
      mocks.rpcResult.mockResolvedValue({ data: status, error: null });
      const result = await downloadModelAction(request);
      expect(result).toEqual({ ok: false, error: status });
      expect(JSON.stringify(result)).not.toContain("test-signed-token");
    },
  );

  it.each([null, "unexpected", { status: "ok" }])(
    "rejects an unrecognized RPC result: %j",
    async (data) => {
      mocks.rpcResult.mockResolvedValue({ data, error: null });
      expect(await downloadModelAction(request)).toEqual({
        ok: false,
        error: "generic",
      });
    },
  );

  it("does not expose the URL on an RPC error", async () => {
    mocks.rpcResult.mockResolvedValue({
      data: null,
      error: { message: "RPC failed" },
    });
    expect(await downloadModelAction(request)).toEqual({
      ok: false,
      error: "generic",
    });
  });

  it.each(["auth", "profile", "model", "file", "signing", "rpc"] as const)(
    "bounds the whole action to 10 seconds when %s stalls",
    async (stage) => {
      vi.useFakeTimers();
      const pending = new Promise<never>(() => {});
      const stages = {
        auth: mocks.getUser,
        profile: mocks.profileQuery.maybeSingle,
        model: mocks.modelQuery.maybeSingle,
        file: mocks.fileQuery.maybeSingle,
        signing: mocks.createSignedUrl,
        rpc: mocks.rpcResult,
      };
      stages[stage].mockReturnValue(pending);
      const result = downloadModelAction(request);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await result).toEqual({ ok: false, error: "timeout" });
      expect(mocks.rpc).toHaveBeenCalledTimes(stage === "rpc" ? 1 : 0);
      expect(vi.getTimerCount()).toBe(0);
      if (stage === "rpc") {
        const signal = mocks.rpcAbortSignal.mock.calls[0]?.[0];
        expect(signal).toBeInstanceOf(AbortSignal);
        expect(signal?.aborted).toBe(true);
      }
    },
  );

  it("converts unexpected network failures to a safe result", async () => {
    mocks.createSignedUrl.mockRejectedValue(new Error("Connection lost"));
    expect(await downloadModelAction(request)).toEqual({
      ok: false,
      error: "generic",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
