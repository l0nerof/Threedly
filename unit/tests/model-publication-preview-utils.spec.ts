import { PUBLICATION_EDITOR_REQUEST_TIMEOUT_MS } from "@/src/business/constants/modelPublicationEditor";
import { publicationMetadata } from "@/src/business/utils/modelPublicationEditor";
import {
  awaitPublicationPreview,
  publicationPreviewAuthor,
  publicationPreviewCover,
  publicationPreviewSnapshot,
} from "@/src/business/utils/modelPublicationPreview";
import { vi } from "vitest";
import { afterEach, describe, expect, it } from "../fixtures";
import {
  editorFixture,
  editorInitialData,
} from "../mocks/model-publication-editor";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
const emptyFiles = { source: null, cover: null };

describe("publication preview snapshots and read boundaries", () => {
  it("copies current metadata without inventing model identity or publication facts", () => {
    const metadata = publicationMetadata(null);
    const snapshot = publicationPreviewSnapshot(metadata, emptyFiles, null);
    metadata.titleEn = "Later edit";
    expect(snapshot.metadata.titleEn).toBe("");
    expect(snapshot).toEqual({
      metadata: publicationMetadata(null),
      source: null,
      coverFile: null,
      savedCover: null,
    });
    expect(snapshot).not.toHaveProperty("slug");
    expect(snapshot).not.toHaveProperty("download_count");
    expect(snapshot).not.toHaveProperty("published_at");
  });
  it("prefers actual selected files to stored assets without uploading or assigning IDs", () => {
    const source = new File(["o new"], "new.obj");
    const cover = new File(["cover"], "new.png", { type: "image/png" });
    const saved = editorInitialData();
    const snapshot = publicationPreviewSnapshot(
      publicationMetadata(saved),
      { source, cover },
      saved,
    );
    expect(snapshot.source).toEqual({
      file_name: source.name,
      format: "obj",
      file_size_bytes: source.size,
      is_primary: true,
    });
    expect(snapshot.source).not.toHaveProperty("id");
    expect(snapshot.coverFile).toBe(cover);
    expect(snapshot.savedCover).toBeNull();
    expect(saved.source?.name).not.toBe("new.obj");
  });
  it("uses real saved file summaries when no replacement is selected", () => {
    const saved = editorInitialData();
    const snapshot = publicationPreviewSnapshot(
      publicationMetadata(saved),
      emptyFiles,
      saved,
    );
    expect(snapshot.source?.file_name).toBe(saved.source?.name);
    expect(snapshot.savedCover).toEqual({
      draftId: saved.draft.id,
      assetId: saved.cover?.id,
    });
  });
  it("does not silently substitute a saved file for an invalid selected file", () => {
    const saved = editorInitialData();
    const result = publicationPreviewSnapshot(
      publicationMetadata(saved),
      { ...emptyFiles, source: new File(["x"], "bad.exe") },
      saved,
    );
    expect(result.source).toBeNull();
  });
  it.each([
    null,
    { ok: true, data: { ...editorFixture.author, id: "wrong" } },
    {
      ok: true,
      data: {
        ...editorFixture.author,
        id: "00000000-0000-0000-0000-00000000a902",
      },
    },
    {
      ok: true,
      data: { ...editorFixture.author, avatar_path: "javascript:alert(1)" },
    },
    { ok: false, error: "generic" },
  ])("validates the server action response and its owner", (value) => {
    expect(() =>
      publicationPreviewAuthor(value, editorFixture.user.id),
    ).toThrow();
  });
  it("only accepts a fresh signed cover for the snapshot's actual asset", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55321");
    const data = editorInitialData();
    const expected = {
      draftId: data.draft.id,
      assetId: editorFixture.cover.id,
    };
    expect(
      publicationPreviewCover(
        { ok: true, data },
        editorFixture.user.id,
        expected,
      ),
    ).toBe(data.coverUrl);
    expect(() =>
      publicationPreviewCover({ ok: true, data }, editorFixture.user.id, {
        ...expected,
        assetId: editorFixture.source.id,
      }),
    ).toThrow("conflict");
    for (const coverUrl of [
      "https://example.com/private.png?token=x",
      data.coverUrl?.replace("token=test", ""),
      data.coverUrl?.replace("model-draft-images", "avatars"),
    ]) {
      expect(() =>
        publicationPreviewCover(
          { ok: true, data: { ...data, coverUrl } },
          editorFixture.user.id,
          expected,
        ),
      ).toThrow();
    }
  });
  it("cancels a pending read without waiting for a late server response", async () => {
    const controller = new AbortController();
    const result = awaitPublicationPreview(
      new Promise<never>(() => {}),
      controller.signal,
    );
    const assertion = expect(result).rejects.toThrow();
    controller.abort();
    await assertion;
  });
  it("times out a transport read and releases its timer", async () => {
    vi.useFakeTimers();
    const result = awaitPublicationPreview(
      new Promise<never>(() => {}),
      new AbortController().signal,
    );
    const assertion = expect(result).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(PUBLICATION_EDITOR_REQUEST_TIMEOUT_MS);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});
