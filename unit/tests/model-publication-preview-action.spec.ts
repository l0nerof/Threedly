import { fetchPublicationPreviewAuthorAction } from "@/src/app/[locale]/(main-pages)/profile/uploads/preview-actions";
import { PUBLICATION_REQUEST_TIMEOUT_MS } from "@/src/business/constants/modelPublication";
import { redirect } from "next/navigation";
import { vi } from "vitest";
import { afterEach, beforeEach, describe, expect, it } from "../fixtures";
import { modelManagementMocks } from "../mocks/model-management";
import {
  editorFixture,
  editorMocks,
  resetEditorMocks,
} from "../mocks/model-publication-editor";

vi.mock("@/src/business/utils/supabase/server", async () => ({
  createClient: (await import("../mocks/model-publication-editor")).editorMocks
    .serverClient,
}));
vi.mock("next/cache", async () => ({
  revalidatePath: (await import("../mocks/model-publication-editor"))
    .editorMocks.revalidatePath,
}));

const input = { ownerId: editorFixture.user.id };
beforeEach(() => {
  resetEditorMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55321");
});
afterEach(() => {
  expect(editorMocks.rpc).not.toHaveBeenCalled();
  expect(editorMocks.storageFrom).not.toHaveBeenCalled();
  expect(editorMocks.revalidatePath).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("publication preview author read", () => {
  it("authenticates and selects only the actual author's public fields", async () => {
    expect(await fetchPublicationPreviewAuthorAction(input)).toEqual({
      ok: true,
      data: editorFixture.author,
    });
    expect(modelManagementMocks.getUser).toHaveBeenCalledOnce();
    expect(editorMocks.authorSelect).toHaveBeenCalledExactlyOnceWith(
      "id,username,avatar_path",
    );
    expect(editorMocks.authorEq).toHaveBeenCalledExactlyOnceWith(
      "id",
      input.ownerId,
    );
  });
  it("resolves a stored avatar path without exposing other profile fields", async () => {
    editorMocks.authorSingle.mockResolvedValueOnce({
      data: {
        ...editorFixture.author,
        avatar_path: "creator/avatar.png",
        can_upload: true,
        bio: "private",
      },
      error: null,
    });
    expect(await fetchPublicationPreviewAuthorAction(input)).toEqual({
      ok: true,
      data: {
        ...editorFixture.author,
        avatar_path:
          "http://127.0.0.1:55321/storage/v1/object/public/avatars/creator/avatar.png",
      },
    });
  });
  it.each([null, {}, { ownerId: "bad" }, { ...input, extra: true }])(
    "rejects invalid input before creating a client",
    async (value) => {
      expect(await fetchPublicationPreviewAuthorAction(value)).toEqual({
        ok: false,
        error: "invalid_request",
      });
      expect(editorMocks.serverClient).not.toHaveBeenCalled();
    },
  );
  it("rejects a changed account before reading profiles", async () => {
    expect(
      await fetchPublicationPreviewAuthorAction({
        ownerId: "00000000-0000-0000-0000-00000000a902",
      }),
    ).toEqual({ ok: false, error: "session_changed" });
    expect(editorMocks.authorSelect).not.toHaveBeenCalled();
  });
  it("rejects an unauthenticated request", async () => {
    modelManagementMocks.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    expect(await fetchPublicationPreviewAuthorAction(input)).toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(editorMocks.authorSelect).not.toHaveBeenCalled();
  });
  it.each([
    { data: null, error: null },
    {
      data: editorFixture.author,
      error: { message: "private database detail" },
    },
    {
      data: {
        ...editorFixture.author,
        id: "00000000-0000-0000-0000-00000000a902",
      },
      error: null,
    },
    { data: { ...editorFixture.author, username: "" }, error: null },
    { data: { ...editorFixture.author, avatar_path: 7 }, error: null },
    {
      data: { ...editorFixture.author, avatar_path: "https://[bad" },
      error: null,
    },
  ])(
    "does not invent author data on failed or malformed responses",
    async (response) => {
      editorMocks.authorSingle.mockResolvedValueOnce(response);
      expect(await fetchPublicationPreviewAuthorAction(input)).toEqual({
        ok: false,
        error: "generic",
      });
    },
  );
  it("bounds a profile request and clears its timer", async () => {
    vi.useFakeTimers();
    editorMocks.authorSingle.mockImplementationOnce(
      () => new Promise(() => {}),
    );
    const result = fetchPublicationPreviewAuthorAction(input);
    await vi.advanceTimersByTimeAsync(PUBLICATION_REQUEST_TIMEOUT_MS);
    expect(await result).toEqual({ ok: false, error: "timeout" });
    expect(vi.getTimerCount()).toBe(0);
  });
  it("preserves actual Next.js control-flow errors", async () => {
    editorMocks.authorSingle.mockImplementationOnce(() =>
      redirect("/en/login"),
    );
    await expect(fetchPublicationPreviewAuthorAction(input)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
  });
});
