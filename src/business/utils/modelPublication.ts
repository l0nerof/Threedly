import {
  PUBLICATION_COVER_BUCKET,
  PUBLICATION_SOURCE_BUCKET,
} from "@/src/business/constants/modelPublication";
import { publicationManifestSchema } from "@/src/business/schemas/modelPublication";
import type {
  PublicationAsset,
  PublicationManifest,
  PublicationObject,
} from "@/src/business/types/modelPublication";
import {
  buildModelCoverImageStoragePath,
  buildModelUploadStoragePath,
  getModelCoverImageExtension,
  getModelUploadFileExtension,
} from "@/src/business/utils/modelUpload";

export { awaitModelManagementRequest as awaitPublicationRequest } from "@/src/business/utils/modelManagement";

export function getPublicationManifest(
  file: File,
  kind: "source" | "cover",
): PublicationManifest | null {
  const extension =
    kind === "cover"
      ? getModelCoverImageExtension(file.type)
      : getModelUploadFileExtension(file.name);
  const parsed = publicationManifestSchema.safeParse({
    kind,
    name: file.name,
    extension,
    size: file.size,
    mimeType: kind === "cover" ? file.type : "application/octet-stream",
  });
  return parsed.success ? parsed.data : null;
}

export function isPublicationAssetPath(
  asset: PublicationAsset,
  userId: string,
  draftId: string,
  modelId: string | null,
): boolean {
  const expectedBucket =
    asset.kind === "cover"
      ? PUBLICATION_COVER_BUCKET
      : PUBLICATION_SOURCE_BUCKET;
  if (
    asset.draftId !== draftId ||
    asset.bucket !== expectedBucket ||
    asset.path !==
      userId + "/" + draftId + "/" + asset.id + "." + asset.extension
  )
    return false;
  if (!modelId)
    return asset.destinationBucket === null && asset.destinationPath === null;
  const expectedPath =
    asset.kind === "cover"
      ? buildModelCoverImageStoragePath({
          userId,
          modelId,
          mimeType: asset.mimeType,
        })
      : buildModelUploadStoragePath({ userId, modelId, fileName: asset.name });
  return (
    asset.destinationPath === expectedPath &&
    asset.destinationBucket ===
      (asset.kind === "cover" ? "model-images" : "models")
  );
}

export function isPublicationCleanupPath(
  object: PublicationObject,
  userId: string,
  draftId: string,
  modelId: string | null,
): boolean {
  const privateBucket =
    object.bucket === PUBLICATION_COVER_BUCKET ||
    object.bucket === PUBLICATION_SOURCE_BUCKET;
  const scope = privateBucket ? draftId : modelId;
  if (!scope) return false;
  const prefix = userId + "/" + scope + "/";
  return (
    object.path.startsWith(prefix) &&
    /^[a-z0-9][a-z0-9._-]*$/.test(object.path.slice(prefix.length))
  );
}
