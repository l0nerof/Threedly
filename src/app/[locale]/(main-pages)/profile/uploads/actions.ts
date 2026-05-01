"use server";

import {
  MAX_MODEL_COVER_IMAGE_SIZE_BYTES,
  MAX_MODEL_UPLOAD_FILE_SIZE_BYTES,
  MODEL_IMAGE_UPLOAD_BUCKET,
  MODEL_UPLOAD_BUCKET,
  MODEL_UPLOAD_STORAGE_PROVIDER,
} from "@/src/business/constants/modelUpload";
import { modelUploadMetadataSchema } from "@/src/business/schemas/modelUpload";
import type { ModelUploadActionResult } from "@/src/business/types/modelUpload";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import {
  buildModelCoverImageStoragePath,
  buildModelPreviewStoragePath,
  buildModelUploadSlug,
  buildModelUploadStoragePath,
  getModelCoverImageExtension,
  getModelPreviewFileExtension,
  getModelUploadFileExtension,
} from "@/src/business/utils/modelUpload";
import { createClient } from "@/src/business/utils/supabase/server";
import { revalidatePath } from "next/cache";

function getRequiredFile(formData: FormData, fieldName: string): File | null {
  const fileValue = formData.get(fieldName);

  if (!fileValue || typeof fileValue === "string") {
    return null;
  }

  return fileValue;
}

function getOptionalFile(formData: FormData, fieldName: string): File | null {
  const fileValue = formData.get(fieldName);

  if (!fileValue || typeof fileValue === "string" || fileValue.size === 0) {
    return null;
  }

  return fileValue;
}

export async function uploadModelAction(
  locale: string,
  formData: FormData,
): Promise<ModelUploadActionResult> {
  if (!isLocaleCode(locale)) {
    return { ok: false, error: "invalidLocale" };
  }

  const parsedMetadata = modelUploadMetadataSchema.safeParse({
    titleUa: formData.get("titleUa"),
    titleEn: formData.get("titleEn"),
    descriptionUa: formData.get("descriptionUa"),
    descriptionEn: formData.get("descriptionEn"),
    categoryId: formData.get("categoryId"),
    minimumPlan: formData.get("minimumPlan"),
  });

  if (!parsedMetadata.success) {
    return { ok: false, error: "invalidMetadata" };
  }

  const modelFile = getRequiredFile(formData, "modelFile");
  if (!modelFile || modelFile.size === 0) {
    return { ok: false, error: "invalidFile" };
  }

  const coverImage = getRequiredFile(formData, "coverImage");
  if (!coverImage || coverImage.size === 0) {
    return { ok: false, error: "invalidCoverImage" };
  }

  if (modelFile.size > MAX_MODEL_UPLOAD_FILE_SIZE_BYTES) {
    return { ok: false, error: "fileTooLarge" };
  }

  if (coverImage.size > MAX_MODEL_COVER_IMAGE_SIZE_BYTES) {
    return { ok: false, error: "coverImageTooLarge" };
  }

  const fileExtension = getModelUploadFileExtension(modelFile.name);
  if (!fileExtension) {
    return { ok: false, error: "unsupportedFileType" };
  }

  if (!getModelCoverImageExtension(coverImage.type)) {
    return { ok: false, error: "unsupportedCoverImageType" };
  }

  const previewModelFile = getOptionalFile(formData, "previewModelFile");
  if (
    previewModelFile?.size &&
    previewModelFile.size > MAX_MODEL_UPLOAD_FILE_SIZE_BYTES
  ) {
    return { ok: false, error: "previewFileTooLarge" };
  }

  const previewFileExtension = previewModelFile
    ? getModelPreviewFileExtension(previewModelFile.name)
    : null;
  if (previewModelFile && !previewFileExtension) {
    return { ok: false, error: "unsupportedPreviewFileType" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const modelId = crypto.randomUUID();
  const storagePath = buildModelUploadStoragePath({
    userId: user.id,
    modelId,
    fileName: modelFile.name,
  });
  const coverImagePath = buildModelCoverImageStoragePath({
    userId: user.id,
    modelId,
    mimeType: coverImage.type,
  });
  const previewModelPath = previewModelFile
    ? buildModelPreviewStoragePath({
        userId: user.id,
        modelId,
        fileName: previewModelFile.name,
      })
    : null;
  const uploadedModelStoragePaths: string[] = [];
  const uploadedImageStoragePaths: string[] = [];

  const cleanupUploadedFiles = async () => {
    if (uploadedModelStoragePaths.length > 0) {
      await supabase.storage
        .from(MODEL_UPLOAD_BUCKET)
        .remove(uploadedModelStoragePaths);
    }

    if (uploadedImageStoragePaths.length > 0) {
      await supabase.storage
        .from(MODEL_IMAGE_UPLOAD_BUCKET)
        .remove(uploadedImageStoragePaths);
    }
  };

  const { error: uploadError } = await supabase.storage
    .from(MODEL_UPLOAD_BUCKET)
    .upload(storagePath, modelFile, {
      upsert: false,
      contentType: modelFile.type || "application/octet-stream",
      cacheControl: "31536000",
    });

  if (uploadError) {
    console.error("[uploadModelAction] storage upload error", uploadError);
    return { ok: false, error: "uploadFailed" };
  }
  uploadedModelStoragePaths.push(storagePath);

  const { error: coverUploadError } = await supabase.storage
    .from(MODEL_IMAGE_UPLOAD_BUCKET)
    .upload(coverImagePath, coverImage, {
      upsert: false,
      contentType: coverImage.type,
      cacheControl: "31536000",
    });

  if (coverUploadError) {
    console.error(
      "[uploadModelAction] cover image upload error",
      coverUploadError,
    );
    await cleanupUploadedFiles();
    return { ok: false, error: "uploadFailed" };
  }
  uploadedImageStoragePaths.push(coverImagePath);

  if (previewModelFile && previewModelPath) {
    const { error: previewUploadError } = await supabase.storage
      .from(MODEL_UPLOAD_BUCKET)
      .upload(previewModelPath, previewModelFile, {
        upsert: false,
        contentType: previewModelFile.type || "model/gltf-binary",
        cacheControl: "31536000",
      });

    if (previewUploadError) {
      console.error(
        "[uploadModelAction] preview model upload error",
        previewUploadError,
      );
      await cleanupUploadedFiles();
      return { ok: false, error: "uploadFailed" };
    }
    uploadedModelStoragePaths.push(previewModelPath);
  }

  const metadata = parsedMetadata.data;
  const { data: createdModel, error: modelInsertError } = await supabase
    .from("models")
    .insert({
      id: modelId,
      slug: buildModelUploadSlug(metadata.titleEn, modelId),
      creator_id: user.id,
      category_id: metadata.categoryId,
      title_ua: metadata.titleUa,
      title_en: metadata.titleEn,
      description_ua: metadata.descriptionUa,
      description_en: metadata.descriptionEn,
      cover_image_path: coverImagePath,
      preview_model_path: previewModelPath,
      status: "published",
      minimum_plan: metadata.minimumPlan,
      file_format: fileExtension,
      file_size_bytes: modelFile.size,
      polygon_count: null,
      download_count: 0,
      is_featured: false,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (modelInsertError || !createdModel) {
    console.error("[uploadModelAction] model insert error", modelInsertError);
    await cleanupUploadedFiles();
    return { ok: false, error: "metadataSaveFailed" };
  }

  const { error: fileInsertError } = await supabase.from("model_files").insert({
    model_id: createdModel.id,
    storage_provider: MODEL_UPLOAD_STORAGE_PROVIDER,
    bucket: MODEL_UPLOAD_BUCKET,
    object_path: storagePath,
    file_name: modelFile.name,
    format: fileExtension,
    file_size_bytes: modelFile.size,
    is_primary: true,
  });

  if (fileInsertError) {
    console.error(
      "[uploadModelAction] model file insert error",
      fileInsertError,
    );
    await supabase.from("models").delete().eq("id", createdModel.id);
    await cleanupUploadedFiles();
    return { ok: false, error: "metadataSaveFailed" };
  }

  revalidatePath(`/${locale}/profile/uploads`);

  return { ok: true, modelId: createdModel.id };
}
