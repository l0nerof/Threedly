export const MODEL_UPLOAD_BUCKET = "marketplace-files";
export const MODEL_UPLOAD_STORAGE_PROVIDER = "supabase";
export const MODEL_UPLOAD_DEFAULT_COVER_PATH = "/logo.png";
export const MAX_MODEL_UPLOAD_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const modelUploadExtensions = [
  "glb",
  "gltf",
  "fbx",
  "obj",
  "max",
  "blend",
  "zip",
] as const;
