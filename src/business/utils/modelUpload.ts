import {
  MODEL_IMAGE_UPLOAD_BUCKET,
  modelCoverImageMimeTypeExtensions,
  modelPreviewExtensions,
  modelUploadExtensions,
} from "@/src/business/constants/modelUpload";
import type {
  ModelCoverImageExtension,
  ModelCoverImageMimeType,
  ModelPreviewExtension,
  ModelUploadExtension,
} from "@/src/business/types/modelUpload";

type BuildStoragePathParams = {
  userId: string;
  modelId: string;
  fileName: string;
};

type BuildCoverImageStoragePathParams = {
  userId: string;
  modelId: string;
  mimeType: string;
};

function isModelUploadExtension(value: string): value is ModelUploadExtension {
  return modelUploadExtensions.includes(value as ModelUploadExtension);
}

function isModelPreviewExtension(
  value: string,
): value is ModelPreviewExtension {
  return modelPreviewExtensions.includes(value as ModelPreviewExtension);
}

function isModelCoverImageMimeType(
  value: string,
): value is ModelCoverImageMimeType {
  return Object.hasOwn(modelCoverImageMimeTypeExtensions, value);
}

export function getModelUploadFileExtension(
  fileName: string,
): ModelUploadExtension | null {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension || extension === fileName.toLowerCase()) {
    return null;
  }

  return isModelUploadExtension(extension) ? extension : null;
}

export function getModelPreviewFileExtension(
  fileName: string,
): ModelPreviewExtension | null {
  const extension = getModelUploadFileExtension(fileName);

  return extension && isModelPreviewExtension(extension) ? extension : null;
}

export function getModelCoverImageExtension(
  mimeType: string,
): ModelCoverImageExtension | null {
  if (!isModelCoverImageMimeType(mimeType)) {
    return null;
  }

  return modelCoverImageMimeTypeExtensions[mimeType];
}

export function sanitizeModelUploadFileName(fileName: string): string {
  const extension = getModelUploadFileExtension(fileName);
  const fallbackName = extension ? `model.${extension}` : "model";
  const fileExtension = extension ?? "bin";

  const normalizedFileName = fileName.trim() || fallbackName;
  const dotIndex = normalizedFileName.lastIndexOf(".");
  const rawName =
    dotIndex > 0 ? normalizedFileName.slice(0, dotIndex) : normalizedFileName;

  const safeName = rawName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${safeName || "model"}.${fileExtension}`;
}

export function buildModelUploadStoragePath({
  userId,
  modelId,
  fileName,
}: BuildStoragePathParams): string {
  return `${userId}/${modelId}/${sanitizeModelUploadFileName(fileName)}`;
}

export function buildModelCoverImageStoragePath({
  userId,
  modelId,
  mimeType,
}: BuildCoverImageStoragePathParams): string {
  const extension = getModelCoverImageExtension(mimeType) ?? "jpg";

  return `${userId}/${modelId}/cover.${extension}`;
}

export function buildModelPreviewStoragePath({
  userId,
  modelId,
  fileName,
}: BuildStoragePathParams): string {
  const extension = getModelPreviewFileExtension(fileName) ?? "glb";

  return `${userId}/${modelId}/preview.${extension}`;
}

export function buildModelUploadSlug(titleEn: string, modelId: string): string {
  const baseSlug = titleEn
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${baseSlug || "model"}-${modelId.slice(0, 8)}`;
}

export function resolveModelCoverImageUrl(coverImagePath: string): string {
  if (
    coverImagePath.startsWith("/") ||
    coverImagePath.startsWith("http://") ||
    coverImagePath.startsWith("https://")
  ) {
    return coverImagePath;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return coverImagePath;
  }

  return `${supabaseUrl}/storage/v1/object/public/${MODEL_IMAGE_UPLOAD_BUCKET}/${coverImagePath}`;
}
