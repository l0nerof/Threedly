import { MODEL_FILES_LIMIT } from "@/src/business/constants/modelDownload";
import {
  MODEL_UPLOAD_BUCKET,
  MODEL_UPLOAD_STORAGE_PROVIDER,
} from "@/src/business/constants/modelUpload";
import {
  modelDownloadModelSchema,
  modelDownloadRequestSchema,
  modelFileSummarySchema,
} from "@/src/business/schemas/modelDownload";
import type { ModelFilesResult } from "@/src/business/types/modelDownload";
import { createAdminClient } from "@/src/business/utils/supabase/admin";
import { createClient } from "@/src/business/utils/supabase/server";

const publishedModelSchema = modelDownloadModelSchema.pick({
  id: true,
  status: true,
});

export async function fetchPublicModelFiles(
  modelId: string,
): Promise<ModelFilesResult> {
  const id = modelDownloadRequestSchema.shape.modelId.safeParse(modelId);
  if (!id.success) return { ok: false };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const client = await createClient();
    const model = await client
      .from("models")
      .select("id, status")
      .eq("id", id.data)
      .eq("status", "published")
      .abortSignal(controller.signal)
      .maybeSingle();

    if (model.error || controller.signal.aborted) return { ok: false };
    if (!model.data) return { ok: true, files: [] };
    const publishedModel = publishedModelSchema.safeParse(model.data);
    if (!publishedModel.success || publishedModel.data.id !== id.data) {
      return { ok: false };
    }

    const admin = createAdminClient(controller.signal);
    const result = await admin
      .from("model_files")
      .select("id, file_name, format, file_size_bytes, is_primary")
      .eq("model_id", id.data)
      .eq("storage_provider", MODEL_UPLOAD_STORAGE_PROVIDER)
      .eq("bucket", MODEL_UPLOAD_BUCKET)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(MODEL_FILES_LIMIT + 1)
      .abortSignal(controller.signal);

    if (result.error || controller.signal.aborted) return { ok: false };
    const files = modelFileSummarySchema
      .array()
      .max(MODEL_FILES_LIMIT)
      .safeParse(result.data);
    return files.success ? { ok: true, files: files.data } : { ok: false };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}
