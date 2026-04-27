import { modelUploadExtensions } from "@/src/business/constants/modelUpload";
import type { ModelUploadExtension } from "@/src/business/types/modelUpload";

type BuildStoragePathParams = {
  userId: string;
  modelId: string;
  fileName: string;
};

function isModelUploadExtension(value: string): value is ModelUploadExtension {
  return modelUploadExtensions.includes(value as ModelUploadExtension);
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
