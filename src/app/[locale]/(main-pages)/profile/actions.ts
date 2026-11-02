"use server";

import { marketplacePlanKeys } from "@/src/business/constants/plans";
import type { Database } from "@/src/business/types/database.generated";
import { createClient } from "@/src/business/utils/supabase/server";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

type ProfileOverview =
  Database["public"]["Functions"]["get_profile_overview"]["Returns"][number];

export type ProfileOverviewResult =
  | { ok: true; overview: ProfileOverview }
  | { ok: false; error: "unauthorized" | "generic" | "timeout" };

const countSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const overviewSchema = z.object({
  profile_id: z.string().guid(),
  plan_key: z.enum(marketplacePlanKeys),
  downloads_limit_monthly: countSchema,
  downloads_used_this_month: countSchema,
  published_uploads: countSchema,
  favorite_models: countSchema,
}) satisfies z.ZodType<ProfileOverview>;

async function awaitProfileRequest<T>(
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

export async function fetchProfileOverviewData(): Promise<ProfileOverviewResult> {
  const controller = new AbortController();
  const { signal } = controller;
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const supabase = await awaitProfileRequest(createClient(), signal);
    const {
      data: { user },
      error: userError,
    } = await awaitProfileRequest(supabase.auth.getUser(), signal);
    if (userError) {
      return {
        ok: false,
        error: [400, 401, 403].includes(userError.status ?? 0)
          ? "unauthorized"
          : "generic",
      };
    }
    if (!user) return { ok: false, error: "unauthorized" };

    const result = await awaitProfileRequest(
      supabase.rpc("get_profile_overview").abortSignal(signal).maybeSingle(),
      signal,
    );
    if (result.error)
      return { ok: false, error: signal.aborted ? "timeout" : "generic" };

    const overview = overviewSchema.safeParse(result.data);
    if (!overview.success || overview.data.profile_id !== user.id)
      return { ok: false, error: "generic" };
    return { ok: true, overview: overview.data };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: signal.aborted ? "timeout" : "generic" };
  } finally {
    clearTimeout(timeout);
  }
}
