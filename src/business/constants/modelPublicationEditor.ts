export const publicationEditorTextFields = [
  { name: "titleUa", language: "ua", multiline: false },
  { name: "descriptionUa", language: "ua", multiline: true },
  { name: "titleEn", language: "en", multiline: false },
  { name: "descriptionEn", language: "en", multiline: true },
] as const;

export const publicationReadinessFields = [
  "titleUa",
  "titleEn",
  "category",
  "source",
  "cover",
] as const;

export const PUBLICATION_EDITOR_REQUEST_TIMEOUT_MS = 15_000;
export const PUBLICATION_EMPTY_CATEGORY = "none";
