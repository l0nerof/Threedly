"use client";

import {
  FAVORITES_BATCH_SIZE,
  FAVORITES_REQUEST_TIMEOUT_MS,
} from "@/src/business/constants/favorites";
import {
  designerFollowInputSchema,
  favoriteIdSchema,
  favoriteRowsSchema,
  favoriteUserSchema,
  followRowsSchema,
  modelFavoriteInputSchema,
} from "@/src/business/schemas/favorites";
import type {
  FavoritesErrorCode,
  SetDesignerFollowArgs,
  SetModelFavoriteArgs,
} from "@/src/business/types/favorites";
import { createClient } from "@/src/business/utils/supabase/client";
import type { PostgrestError } from "@supabase/supabase-js";

export const favoritesQueryKeys = {
  root: ["favorites"] as const,
  currentUser: () => [...favoritesQueryKeys.root, "current-user"] as const,
  sessionRevision: () =>
    [...favoritesQueryKeys.root, "session-revision"] as const,
  followedDesigners: (userId: string) =>
    [...favoritesQueryKeys.root, "designer-follows", userId] as const,
  modelFavorites: (userId: string) =>
    [...favoritesQueryKeys.root, "models", userId] as const,
  mutation: (kind: "model" | "designer", userId: string, targetId: string) =>
    [...favoritesQueryKeys.root, "mutation", kind, userId, targetId] as const,
};

export class FavoritesRequestError extends Error {
  constructor(public readonly code: FavoritesErrorCode) {
    super(code);
    this.name = "FavoritesRequestError";
  }
}

export function getFavoritesErrorCode(error: unknown): FavoritesErrorCode {
  return error instanceof FavoritesRequestError ? error.code : "generic";
}

async function withFavoritesRequest<T>(
  parent: AbortSignal | undefined,
  task: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const { signal } = controller;
  const cancel = () =>
    controller.abort(new FavoritesRequestError("sessionChanged"));
  if (parent?.aborted) cancel();
  else parent?.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(
    () => controller.abort(new FavoritesRequestError("timeout")),
    FAVORITES_REQUEST_TIMEOUT_MS,
  );
  let rejectOnAbort = () => {};
  try {
    signal.throwIfAborted();
    return await Promise.race([
      task(signal),
      new Promise<never>((_, reject) => {
        rejectOnAbort = () => reject(signal.reason);
        signal.addEventListener("abort", rejectOnAbort, { once: true });
      }),
    ]);
  } catch (error) {
    if (signal.aborted) throw signal.reason;
    if (error instanceof FavoritesRequestError) throw error;
    throw new FavoritesRequestError("generic");
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", rejectOnAbort);
    parent?.removeEventListener("abort", cancel);
  }
}

async function readUserId(
  supabase: ReturnType<typeof createClient>,
  signal: AbortSignal,
): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  signal.throwIfAborted();
  if (error) {
    if ([400, 401, 403].includes(error.status ?? 0)) return null;
    throw new FavoritesRequestError("generic");
  }
  if (!user) return null;
  const parsed = favoriteUserSchema.safeParse(user);
  if (!parsed.success) throw new FavoritesRequestError("generic");
  return parsed.data.id;
}

async function verifyOwner(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  signal: AbortSignal,
) {
  const currentUserId = await readUserId(supabase, signal);
  if (!currentUserId) throw new FavoritesRequestError("unauthorized");
  if (currentUserId !== userId)
    throw new FavoritesRequestError("sessionChanged");
}

function throwIfDatabaseError(
  error: PostgrestError | null,
  status: number,
): void {
  if (!error) return;
  if ([401, 403].includes(status))
    throw new FavoritesRequestError("unauthorized");
  throw new FavoritesRequestError(
    error.code === "23503" ? "unavailable" : "generic",
  );
}

export async function fetchCurrentUserId(
  signal?: AbortSignal,
): Promise<string | null> {
  return withFavoritesRequest(signal, (requestSignal) =>
    readUserId(createClient(), requestSignal),
  );
}

function savedIdsQuery(
  supabase: ReturnType<typeof createClient>,
  kind: "model" | "designer",
  userId: string,
  cursor: string | undefined,
  signal: AbortSignal,
) {
  if (kind === "model") {
    const query = supabase
      .from("favorites")
      .select("model_id")
      .eq("user_id", userId)
      .order("model_id", { ascending: true })
      .limit(FAVORITES_BATCH_SIZE);
    if (cursor) query.gt("model_id", cursor);
    return query.abortSignal(signal);
  }
  const query = supabase
    .from("designer_follows")
    .select("designer_id")
    .eq("follower_id", userId)
    .order("designer_id", { ascending: true })
    .limit(FAVORITES_BATCH_SIZE);
  if (cursor) query.gt("designer_id", cursor);
  return query.abortSignal(signal);
}

async function readSavedIds(
  kind: "model" | "designer",
  userId: string,
  parent?: AbortSignal,
): Promise<string[]> {
  const owner = favoriteIdSchema.safeParse(userId);
  if (!owner.success) throw new FavoritesRequestError("invalidRequest");
  return withFavoritesRequest(parent, async (signal) => {
    const supabase = createClient();
    await verifyOwner(supabase, owner.data, signal);
    const ids: string[] = [];
    let cursor: string | undefined;
    while (true) {
      signal.throwIfAborted();
      const result = await savedIdsQuery(
        supabase,
        kind,
        owner.data,
        cursor,
        signal,
      );
      signal.throwIfAborted();
      throwIfDatabaseError(result.error, result.status);
      const batch =
        kind === "model"
          ? favoriteRowsSchema.parse(result.data).map((row) => row.model_id)
          : followRowsSchema.parse(result.data).map((row) => row.designer_id);
      if (batch.length === 0) return ids;
      for (const id of batch) {
        if (cursor && id <= cursor) throw new FavoritesRequestError("generic");
        ids.push(id);
        cursor = id;
      }
    }
  });
}

export async function fetchFavoriteModelIds(
  userId: string,
  signal?: AbortSignal,
): Promise<string[]> {
  return readSavedIds("model", userId, signal);
}

export async function fetchFollowedDesignerIds(
  userId: string,
  signal?: AbortSignal,
): Promise<string[]> {
  return readSavedIds("designer", userId, signal);
}

export async function setModelFavorite(
  input: SetModelFavoriteArgs,
): Promise<void> {
  const parsed = modelFavoriteInputSchema.safeParse(input);
  if (!parsed.success) throw new FavoritesRequestError("invalidRequest");
  const { userId, modelId, isFavorite } = parsed.data;
  return withFavoritesRequest(undefined, async (signal) => {
    const supabase = createClient();
    await verifyOwner(supabase, userId, signal);
    const query = isFavorite
      ? supabase
          .from("favorites")
          .upsert(
            { model_id: modelId, user_id: userId },
            { onConflict: "user_id,model_id", ignoreDuplicates: true },
          )
      : supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("model_id", modelId);
    const result = await query.abortSignal(signal);
    signal.throwIfAborted();
    throwIfDatabaseError(result.error, result.status);
  });
}

export async function setDesignerFollow(
  input: SetDesignerFollowArgs,
): Promise<void> {
  const parsed = designerFollowInputSchema.safeParse(input);
  if (!parsed.success) throw new FavoritesRequestError("invalidRequest");
  const { userId, designerId, isFollowing } = parsed.data;
  return withFavoritesRequest(undefined, async (signal) => {
    const supabase = createClient();
    await verifyOwner(supabase, userId, signal);
    const query = isFollowing
      ? supabase
          .from("designer_follows")
          .upsert(
            { designer_id: designerId, follower_id: userId },
            { onConflict: "follower_id,designer_id", ignoreDuplicates: true },
          )
      : supabase
          .from("designer_follows")
          .delete()
          .eq("follower_id", userId)
          .eq("designer_id", designerId);
    const result = await query.abortSignal(signal);
    signal.throwIfAborted();
    throwIfDatabaseError(result.error, result.status);
  });
}
