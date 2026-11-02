import type { Database } from "@/src/business/types/database.generated";
import { createClient } from "@supabase/supabase-js";
import "server-only";
import { z } from "zod";

const adminEnvironmentSchema = z.object({
  url: z.string().url(),
  key: z.string().min(1),
});

export function createAdminClient(signal: AbortSignal) {
  const environment = adminEnvironmentSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!environment.success) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient<Database>(environment.data.url, environment.data.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: init?.signal
            ? AbortSignal.any([signal, init.signal])
            : signal,
        }),
    },
  });
}
