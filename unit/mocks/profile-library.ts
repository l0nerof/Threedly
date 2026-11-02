import en from "@/messages/en.json";
import ua from "@/messages/ua.json";
import type { CatalogModel } from "@/src/business/types/catalog";
import type { Designer } from "@/src/business/types/designer";
import type { ProfileLibraryPage } from "@/src/business/types/profileLibrary";
import type { User } from "@supabase/supabase-js";
import { createTranslator } from "next-intl";
import { vi } from "vitest";

export const libraryUser = {
  id: "00000000-0000-0000-0000-00000000b001",
  aud: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
} satisfies User;

export function createLibraryModel(index = 1): CatalogModel {
  return {
    id: `00000000-0000-0000-0000-${String(1000 + index).padStart(12, "0")}`,
    slug: `library-model-${index}`,
    title_en: `Library model ${index}`,
    title_ua: `Модель бібліотеки ${index}`,
    description_en: null,
    description_ua: null,
    cover_image_path: "/logo.png",
    minimum_plan: "max",
    file_format: "fbx",
    download_count: 3,
    is_featured: false,
    published_at: "2026-01-01T00:00:00Z",
  };
}

export const libraryDesigner = {
  id: "00000000-0000-0000-0000-00000000c001",
  username: "library_studio",
  bio: "Interior assets",
  avatar_path: null,
  plan_key: "pro",
  created_at: "2026-01-01T00:00:00Z",
  model_count: 1001,
} satisfies Designer;

export function createLibraryFixture(
  overrides: Partial<ProfileLibraryPage> = {},
): ProfileLibraryPage {
  return {
    profile_id: libraryUser.id,
    active_tab: "downloaded",
    current_page: 1,
    total_pages: 1,
    downloaded_count: 1,
    favorite_count: 26,
    followed_count: 25,
    models: [createLibraryModel()],
    designers: [],
    ...overrides,
  };
}

const maybeSingle = vi.fn();
const abortSignal = vi.fn<
  (signal: AbortSignal) => { maybeSingle: typeof maybeSingle }
>(() => ({ maybeSingle }));
const rpc = vi.fn(() => ({ abortSignal }));
const getUser = vi.fn();
export const libraryMocks = {
  createClient: vi.fn(),
  getUser,
  rpc,
  abortSignal,
  maybeSingle,
  browserGetUser: vi.fn(),
  push: vi.fn<(href: string, options?: { scroll: boolean }) => void>(),
  refresh: vi.fn(),
  pathname: "/en/profile/library",
  search: "",
  redirect: vi.fn((href: string): never => {
    throw new Error(`Redirect: ${href}`);
  }),
  notFound: vi.fn((): never => {
    throw new Error("Not found");
  }),
};

export function createLibraryNavigationMock() {
  return {
    useRouter: () => ({
      push: libraryMocks.push,
      refresh: libraryMocks.refresh,
    }),
    usePathname: () => libraryMocks.pathname,
    useSearchParams: () => new URLSearchParams(libraryMocks.search),
    useParams: () => ({
      locale: libraryMocks.pathname.startsWith("/ua/") ? "ua" : "en",
    }),
    redirect: libraryMocks.redirect,
    permanentRedirect: vi.fn(),
    notFound: libraryMocks.notFound,
  };
}

export function createLibraryServerIntlMock() {
  return {
    setRequestLocale: vi.fn(),
    getTranslations: async ({ locale }: { locale: string }) =>
      createTranslator({
        locale,
        messages: locale === "ua" ? ua : en,
        namespace: "Profile",
      }),
  };
}

export function resetLibraryMocks() {
  vi.clearAllMocks();
  libraryMocks.createClient
    .mockReset()
    .mockResolvedValue({ auth: { getUser }, rpc });
  getUser
    .mockReset()
    .mockResolvedValue({ data: { user: { ...libraryUser } }, error: null });
  maybeSingle
    .mockReset()
    .mockResolvedValue({ data: createLibraryFixture(), error: null });
  libraryMocks.browserGetUser
    .mockReset()
    .mockResolvedValue({ data: { user: null }, error: null });
  libraryMocks.push.mockReset();
  libraryMocks.pathname = "/en/profile/library";
  libraryMocks.search = "";
}
