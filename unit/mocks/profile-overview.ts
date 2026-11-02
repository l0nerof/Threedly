import type { Database } from "@/src/business/types/database.generated";
import type { User } from "@supabase/supabase-js";
import { vi } from "vitest";

export const profileOverviewFixture = {
  user: {
    id: "00000000-0000-0000-0000-00000000f001",
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  } satisfies User,
  overview: {
    profile_id: "00000000-0000-0000-0000-00000000f001",
    plan_key: "pro",
    downloads_limit_monthly: 25,
    downloads_used_this_month: 3,
    published_uploads: 7,
    favorite_models: 11,
  } satisfies Database["public"]["Functions"]["get_profile_overview"]["Returns"][number],
};

const maybeSingle = vi.fn();
const abortSignal = vi.fn(() => ({ maybeSingle }));
const rpc = vi.fn(() => ({ abortSignal }));
const getUser = vi.fn();
export const profileOverviewMocks = {
  createClient: vi.fn(),
  getUser,
  rpc,
  abortSignal,
  maybeSingle,
  redirect: vi.fn((href: string): never => {
    throw new Error(`Redirect: ${href}`);
  }),
  notFound: vi.fn((): never => {
    throw new Error("Not found");
  }),
};

export function createProfileNavigationMock() {
  return {
    redirect: profileOverviewMocks.redirect,
    permanentRedirect: vi.fn(),
    notFound: profileOverviewMocks.notFound,
    usePathname: () => "/en/profile",
  };
}

export function resetProfileOverviewMocks() {
  vi.clearAllMocks();
  profileOverviewMocks.createClient
    .mockReset()
    .mockResolvedValue({ auth: { getUser }, rpc });
  getUser.mockReset().mockResolvedValue({
    data: { user: { ...profileOverviewFixture.user } },
    error: null,
  });
  maybeSingle.mockReset().mockResolvedValue({
    data: { ...profileOverviewFixture.overview },
    error: null,
  });
}
