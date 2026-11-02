import type {
  ModelManagementMetadata,
  OwnedModel,
} from "@/src/business/types/modelManagement";

export function isOwnedModelStoragePath(
  path: string,
  userId: string,
  modelId: string,
): boolean {
  const prefix = `${userId}/${modelId}/`;
  if (!path.startsWith(prefix)) return false;
  return /^[a-z0-9][a-z0-9._-]*$/.test(path.slice(prefix.length));
}

export async function awaitModelManagementRequest<T>(
  request: PromiseLike<T>,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();
  let rejectOnAbort = () => {};
  try {
    const result = await Promise.race([
      Promise.resolve(request),
      new Promise<never>((_, reject) => {
        rejectOnAbort = () => reject(signal.reason);
        signal.addEventListener("abort", rejectOnAbort, { once: true });
      }),
    ]);
    signal.throwIfAborted();
    return result;
  } finally {
    signal.removeEventListener("abort", rejectOnAbort);
  }
}

export function toModelManagementMetadata(
  model: OwnedModel,
): ModelManagementMetadata {
  return {
    titleUa: model.title_ua,
    titleEn: model.title_en,
    descriptionUa: model.description_ua,
    descriptionEn: model.description_en,
    categoryId: model.category_id,
    minimumPlan: model.minimum_plan,
  };
}
