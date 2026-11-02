import {
  publicationEditorData,
  publicationMetadata,
  publicationMutationData,
  publicationPageNumber,
  publicationReadiness,
  publicationReady,
  samePublicationMetadata,
} from "@/src/business/utils/modelPublicationEditor";
import { describe, expect, it } from "../fixtures";
import { publicationRow } from "../mocks/model-publication";
import {
  editorFixture,
  editorInitialData,
} from "../mocks/model-publication-editor";

describe("publication editor values", () => {
  it("lists exactly the five required items and accepts empty optional descriptions", () => {
    const saved = editorInitialData();
    const ready = publicationReadiness(
      { ...publicationMetadata(saved), descriptionUa: null, descriptionEn: "" },
      { source: null, cover: null },
      saved,
      editorFixture.categories,
    );
    expect(ready).toMatchObject({
      completed: 5,
      total: 5,
      ready: true,
      metadataValid: true,
    });
    expect(ready.items.map((item) => item.key)).toEqual([
      "titleUa",
      "titleEn",
      "category",
      "source",
      "cover",
    ]);
    expect(
      publicationReadiness(
        publicationMetadata(null),
        { source: null, cover: null },
        null,
        editorFixture.categories,
      ),
    ).toMatchObject({ completed: 0, ready: false });
  });
  it("marks short or oversized titles and unknown categories as incomplete", () => {
    const saved = editorInitialData();
    const metadata = {
      ...publicationMetadata(saved),
      titleUa: " ",
      titleEn: "x".repeat(91),
      categoryId: editorFixture.user.id,
    };
    const result = publicationReadiness(
      metadata,
      { source: null, cover: null },
      saved,
      editorFixture.categories,
    );
    expect(result).toMatchObject({
      completed: 2,
      ready: false,
      metadataValid: false,
    });
    expect(
      result.items.filter((item) => !item.isComplete).map((item) => item.key),
    ).toEqual(["titleUa", "titleEn", "category"]);
  });
  it("keeps optional description errors visible without claiming the model is publishable", () => {
    const saved = editorInitialData();
    const metadata = {
      ...publicationMetadata(saved),
      descriptionEn: "x".repeat(601),
    };
    expect(
      publicationReadiness(
        metadata,
        { source: null, cover: null },
        saved,
        editorFixture.categories,
      ),
    ).toMatchObject({ completed: 5, ready: false, metadataValid: false });
    expect(
      publicationReady(
        metadata,
        { source: null, cover: null },
        saved,
        editorFixture.categories,
      ),
    ).toBe(false);
  });
  it("counts valid local replacements and rejects invalid replacements over saved files", () => {
    const saved = editorInitialData();
    const metadata = publicationMetadata(saved);
    expect(
      publicationReadiness(
        metadata,
        {
          source: new File(["obj"], "model.obj"),
          cover: new File(["png"], "cover.png", { type: "image/png" }),
        },
        null,
        editorFixture.categories,
      ),
    ).toMatchObject({ completed: 5, ready: true });
    expect(
      publicationReadiness(
        metadata,
        {
          source: new File(["x"], "model.exe"),
          cover: new File(["x"], "cover.svg", { type: "image/svg+xml" }),
        },
        saved,
        editorFixture.categories,
      ),
    ).toMatchObject({ completed: 3, ready: false });
  });
  it("validates persisted cleanup state rather than treating missing or malformed flags as clean", () => {
    const data = editorInitialData();
    for (const cleanupPending of [undefined, null, "false", 0]) {
      expect(() =>
        publicationEditorData(
          { ok: true, data: { ...data, cleanupPending } },
          editorFixture.user.id,
          data.draft.id,
        ),
      ).toThrow("generic");
    }
    expect(
      publicationEditorData(
        { ok: true, data: { ...data, cleanupPending: true } },
        editorFixture.user.id,
        data.draft.id,
      ).cleanupPending,
    ).toBe(true);
  });
  it("uses real saved fields and permits incomplete draft text", () => {
    expect(publicationMetadata(null)).toEqual({
      titleUa: "",
      titleEn: "",
      descriptionUa: null,
      descriptionEn: null,
      categoryId: null,
      minimumPlan: "free",
    });
    expect(publicationMetadata(editorInitialData()).titleEn).toBe("Sofa");
  });
  it("compares semantic text without treating null and empty descriptions as an edit", () => {
    const value = publicationMetadata(null);
    expect(
      samePublicationMetadata(value, { ...value, descriptionEn: "" }),
    ).toBe(true);
    expect(samePublicationMetadata(value, { ...value, titleEn: "A" })).toBe(
      false,
    );
  });
  it("requires both languages, a known category, one cover and a source to publish", () => {
    const saved = editorInitialData();
    const files = { source: null, cover: null };
    expect(
      publicationReady(
        publicationMetadata(saved),
        files,
        saved,
        editorFixture.categories,
      ),
    ).toBe(true);
    expect(
      publicationReady(
        { ...publicationMetadata(saved), titleUa: " " },
        files,
        saved,
        editorFixture.categories,
      ),
    ).toBe(false);
    expect(
      publicationReady(publicationMetadata(saved), files, saved, null),
    ).toBe(false);
    expect(
      publicationReady(
        publicationMetadata(saved),
        files,
        { ...saved, source: null },
        editorFixture.categories,
      ),
    ).toBe(false);
    expect(
      publicationReady(
        publicationMetadata(saved),
        {
          ...files,
          cover: new File(["x"], "x.svg", { type: "image/svg+xml" }),
        },
        saved,
        editorFixture.categories,
      ),
    ).toBe(false);
  });
  it("validates owner, identity, asset kinds, URL consistency and response errors", () => {
    const data = editorInitialData();
    expect(
      publicationEditorData(
        { ok: true, data },
        editorFixture.user.id,
        data.draft.id,
      ),
    ).toEqual(data);
    expect(() =>
      publicationEditorData({ ok: true, data }, data.draft.id, data.draft.id),
    ).toThrow("generic");
    expect(() =>
      publicationEditorData(
        { ok: true, data: { ...data, coverUrl: null } },
        editorFixture.user.id,
        data.draft.id,
      ),
    ).toThrow("generic");
    expect(() =>
      publicationEditorData(
        { ok: false, error: "timeout" },
        editorFixture.user.id,
        data.draft.id,
      ),
    ).toThrow("timeout");
    expect(() =>
      publicationEditorData(
        { ok: true, data: {} },
        editorFixture.user.id,
        data.draft.id,
      ),
    ).toThrow("generic");
  });
  it("does not accept mismatched or failed mutations as success", () => {
    expect(() =>
      publicationMutationData(
        { ok: true, data: publicationRow({ result: "conflict" }) },
        editorFixture.draftId,
      ),
    ).toThrow("conflict");
    expect(() =>
      publicationMutationData(
        { ok: true, data: publicationRow() },
        editorFixture.user.id,
      ),
    ).toThrow("generic");
    expect(() =>
      publicationMutationData(
        { ok: false, error: "busy" },
        editorFixture.draftId,
      ),
    ).toThrow("busy");
  });
  it.each([undefined, ["2"], "0", "-1", "2x", "2147483648"])(
    "normalizes invalid draft page %j",
    (value) => expect(publicationPageNumber(value)).toBe(1),
  );
  it("keeps a valid bounded draft page", () =>
    expect(publicationPageNumber("2")).toBe(2));
});
