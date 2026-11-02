import type { TablesInsert } from "@/src/business/types/database.generated";
import type {
  AuthChangeEvent,
  PostgrestError,
  Session,
  User,
} from "@supabase/supabase-js";
import { vi } from "vitest";

export const favoriteFixture = {
  user: {
    id: "00000000-0000-0000-0000-00000000a001",
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  } satisfies User,
  otherUser: {
    id: "00000000-0000-0000-0000-00000000a002",
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  } satisfies User,
  modelId: "00000000-0000-0000-0000-00000000b001",
  designerId: "00000000-0000-0000-0000-00000000c001",
};

type SavedInsert =
  | Pick<TablesInsert<"favorites">, "user_id" | "model_id">
  | Pick<TablesInsert<"designer_follows">, "follower_id" | "designer_id">;
export type FavoriteMockRequest = {
  table: "favorites" | "designer_follows";
  action: "select" | "upsert" | "delete";
  filters: Record<string, string>;
  cursor?: string;
  cursorColumn?: string;
  order?: string;
  limit?: number;
  payload?: SavedInsert;
  conflict?: { onConflict: string; ignoreDuplicates: boolean };
};
export type FavoriteMockResponse = {
  data: unknown;
  error: Pick<PostgrestError, "code" | "message" | "details" | "hint"> | null;
  status: number;
};

export const favoriteMockState: {
  user: User | null;
  models: Map<string, string[]>;
  designers: Map<string, string[]>;
  pathname: string;
} = {
  user: favoriteFixture.user,
  models: new Map<string, string[]>(),
  designers: new Map<string, string[]>(),
  pathname: "/en/catalog",
};
type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void;
const authCallbacks = new Set<AuthCallback>();
export const favoriteRouter = { refresh: vi.fn(), push: vi.fn() };
export const favoriteMocks = {
  getUser: vi.fn(),
  request:
    vi.fn<
      (
        request: FavoriteMockRequest,
        signal: AbortSignal,
      ) => Promise<FavoriteMockResponse>
    >(),
  from: vi.fn((table: string) => {
    if (table !== "favorites" && table !== "designer_follows")
      throw new Error("Unexpected table");
    const request: FavoriteMockRequest = {
      table,
      action: "select",
      filters: {},
    };
    const query = {
      select: vi.fn(() => {
        request.action = "select";
        return query;
      }),
      upsert: vi.fn(
        (
          payload: SavedInsert,
          conflict: { onConflict: string; ignoreDuplicates: boolean },
        ) => {
          request.action = "upsert";
          request.payload = payload;
          request.conflict = conflict;
          return query;
        },
      ),
      delete: vi.fn(() => {
        request.action = "delete";
        return query;
      }),
      eq: vi.fn((column: string, value: string) => {
        request.filters[column] = value;
        return query;
      }),
      order: vi.fn((column: string) => {
        request.order = column;
        return query;
      }),
      limit: vi.fn((limit: number) => {
        request.limit = limit;
        return query;
      }),
      gt: vi.fn((column: string, cursor: string) => {
        request.cursorColumn = column;
        request.cursor = cursor;
        return query;
      }),
      abortSignal: vi.fn((signal: AbortSignal) =>
        favoriteMocks.request(request, signal),
      ),
    };
    return query;
  }),
  unsubscribe: vi.fn(),
  onAuthStateChange: vi.fn((callback: AuthCallback) => {
    authCallbacks.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authCallbacks.delete(callback);
            favoriteMocks.unsubscribe();
          },
        },
      },
    };
  }),
};

export function createFavoriteClientMock() {
  return {
    auth: {
      getUser: favoriteMocks.getUser,
      onAuthStateChange: favoriteMocks.onAuthStateChange,
    },
    from: favoriteMocks.from,
  };
}

export function createFavoriteNavigationMock() {
  return {
    useRouter: () => favoriteRouter,
    usePathname: () => favoriteMockState.pathname,
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({
      locale: favoriteMockState.pathname.startsWith("/ua/") ? "ua" : "en",
    }),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
  };
}

export function emitFavoriteAuth(event: AuthChangeEvent, user: User | null) {
  favoriteMockState.user = user;
  const session: Session | null = user
    ? {
        user,
        access_token: "unit-access",
        refresh_token: "unit-refresh",
        expires_in: 3600,
        token_type: "bearer",
      }
    : null;
  for (const callback of authCallbacks) callback(event, session);
}

export async function executeFavoriteRequest(
  request: FavoriteMockRequest,
  signal: AbortSignal,
): Promise<FavoriteMockResponse> {
  signal.throwIfAborted();
  const isModel = request.table === "favorites";
  const store = isModel
    ? favoriteMockState.models
    : favoriteMockState.designers;
  const ownerColumn = isModel ? "user_id" : "follower_id";
  const targetColumn = isModel ? "model_id" : "designer_id";
  const payload = request.payload;
  const owner = payload
    ? "user_id" in payload
      ? payload.user_id
      : payload.follower_id
    : request.filters[ownerColumn];
  const target = payload
    ? "model_id" in payload
      ? payload.model_id
      : payload.designer_id
    : request.filters[targetColumn];
  const ids = store.get(owner) ?? [];
  if (request.action === "select") {
    const data = [...ids]
      .sort()
      .filter((id) => !request.cursor || id > request.cursor)
      .slice(0, request.limit);
    return {
      data: data.map((id) =>
        isModel ? { model_id: id } : { designer_id: id },
      ),
      error: null,
      status: 200,
    };
  }
  store.set(
    owner,
    request.action === "upsert"
      ? [...new Set([...ids, target])].sort()
      : ids.filter((id) => id !== target),
  );
  return { data: null, error: null, status: 204 };
}

export function resetFavoriteMocks() {
  vi.clearAllMocks();
  authCallbacks.clear();
  favoriteMockState.user = { ...favoriteFixture.user };
  favoriteMockState.models.clear();
  favoriteMockState.designers.clear();
  favoriteMockState.pathname = "/en/catalog";
  favoriteMocks.getUser.mockReset().mockImplementation(async () => ({
    data: { user: favoriteMockState.user },
    error: null,
  }));
  favoriteMocks.request.mockReset().mockImplementation(executeFavoriteRequest);
}

export function favoriteDatabaseFailure(
  code = "XX000",
  status = 500,
): FavoriteMockResponse {
  return {
    data: null,
    error: {
      code,
      message: "private database detail",
      hint: "private hint",
      details: "private detail",
    },
    status,
  };
}

export function deferredFavorite<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
