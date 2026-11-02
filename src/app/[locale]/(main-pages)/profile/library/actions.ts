"use server";

import {
  profileLibraryPageSchema,
  profileLibraryRequestSchema,
} from "@/src/business/schemas/profileLibrary";
import type { ProfileLibraryResult } from "@/src/business/types/profileLibrary";
import { resolveModelCoverImageUrl } from "@/src/business/utils/modelUpload";
import { createClient } from "@/src/business/utils/supabase/server";
import { resolveAvatarPublicUrl } from "@/src/business/utils/supabase/storage";
import { unstable_rethrow } from "next/navigation";

async function awaitLibraryRequest<T>(
  request: PromiseLike<T>,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();
  let rejectOnAbort = () => {};
  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<never>((_, reject) => {
        rejectOnAbort = () => reject(signal.reason);
        signal.addEventListener("abort", rejectOnAbort, { once: true });
      }),
    ]);
  } finally {
    signal.removeEventListener("abort", rejectOnAbort);
  }
}

export async function fetchProfileLibraryData(
  input: unknown = {},
): Promise<ProfileLibraryResult> {
  const request = profileLibraryRequestSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "generic" };
  const controller = new AbortController();
  const { signal } = controller;
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const supabase = await awaitLibraryRequest(createClient(), signal);
    const {
      data: { user },
      error: userError,
    } = await awaitLibraryRequest(supabase.auth.getUser(), signal);
    if (userError)
      return {
        ok: false,
        error: [400, 401, 403].includes(userError.status ?? 0)
          ? "unauthorized"
          : "generic",
      };
    if (!user) return { ok: false, error: "unauthorized" };

    const result = await awaitLibraryRequest(
      supabase
        .rpc("get_profile_library_page", {
          requested_tab: request.data.tab,
          requested_page: request.data.page,
        })
        .abortSignal(signal)
        .maybeSingle(),
      signal,
    );
    if (result.error)
      return { ok: false, error: signal.aborted ? "timeout" : "generic" };

    const parsed = profileLibraryPageSchema.safeParse(result.data);
    if (
      !parsed.success ||
      parsed.data.profile_id !== user.id ||
      parsed.data.active_tab !== request.data.tab ||
      parsed.data.current_page !==
        Math.min(request.data.page, parsed.data.total_pages)
    ) {
      return { ok: false, error: "generic" };
    }
    return {
      ok: true,
      library: {
        ...parsed.data,
        models: parsed.data.models.map((model) => ({
          ...model,
          cover_image_path: resolveModelCoverImageUrl(model.cover_image_path),
        })),
        designers: parsed.data.designers.map((designer) => ({
          ...designer,
          avatar_path: resolveAvatarPublicUrl(designer.avatar_path),
        })),
      },
    };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: signal.aborted ? "timeout" : "generic" };
  } finally {
    clearTimeout(timeout);
  }
}
