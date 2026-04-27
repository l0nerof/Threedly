"use server";

import {
  MAX_MODEL_UPLOAD_FILE_SIZE_BYTES,
  MODEL_UPLOAD_BUCKET,
  MODEL_UPLOAD_DEFAULT_COVER_PATH,
  MODEL_UPLOAD_STORAGE_PROVIDER,
} from "@/src/business/constants/modelUpload";
import { modelUploadMetadataSchema } from "@/src/business/schemas/modelUpload";
import type { ModelUploadActionResult } from "@/src/business/types/modelUpload";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import {
  buildModelUploadSlug,
  buildModelUploadStoragePath,
  getModelUploadFileExtension,
} from "@/src/business/utils/modelUpload";
import { createClient } from "@/src/business/utils/supabase/server";
import { revalidatePath } from "next/cache";

function getRequiredFile(formData: FormData): File | null {
  const fileValue = formData.get("modelFile");

  if (!fileValue || typeof fileValue === "string") {
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

  const modelFile = getRequiredFile(formData);
  if (!modelFile || modelFile.size === 0) {
    return { ok: false, error: "invalidFile" };
  }

  if (modelFile.size > MAX_MODEL_UPLOAD_FILE_SIZE_BYTES) {
    return { ok: false, error: "fileTooLarge" };
  }

  const fileExtension = getModelUploadFileExtension(modelFile.name);
  if (!fileExtension) {
    return { ok: false, error: "unsupportedFileType" };
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
      cover_image_path: MODEL_UPLOAD_DEFAULT_COVER_PATH,
      preview_model_path: null,
      status: "draft",
      minimum_plan: metadata.minimumPlan,
      file_format: fileExtension,
      file_size_bytes: modelFile.size,
      polygon_count: null,
      download_count: 0,
      is_featured: false,
      published_at: null,
    })
    .select("id")
    .single();

  if (modelInsertError || !createdModel) {
    console.error("[uploadModelAction] model insert error", modelInsertError);
    await supabase.storage.from(MODEL_UPLOAD_BUCKET).remove([storagePath]);
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
    await supabase.storage.from(MODEL_UPLOAD_BUCKET).remove([storagePath]);
    return { ok: false, error: "metadataSaveFailed" };
  }

  revalidatePath(`/${locale}/profile/uploads`);

  return { ok: true, modelId: createdModel.id };
}
