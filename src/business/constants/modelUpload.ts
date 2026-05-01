export const MODEL_UPLOAD_BUCKET = "models";
export const MODEL_IMAGE_UPLOAD_BUCKET = "model-images";
export const MODEL_UPLOAD_STORAGE_PROVIDER = "supabase";
export const MAX_MODEL_UPLOAD_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_MODEL_COVER_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const modelUploadExtensions = [
  "glb",
  "gltf",
  "fbx",
  "obj",
  "max",
  "blend",
  "zip",
] as const;

export const modelPreviewExtensions = ["glb", "gltf"] as const;

export const modelCoverImageMimeTypeExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;
