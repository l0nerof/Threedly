export const FAVORITES_REQUEST_TIMEOUT_MS = 10_000;
export const FAVORITES_BATCH_SIZE = 500;
export const FAVORITES_USER_STALE_TIME_MS = 60_000;

export const favoritesErrorCodes = [
  "unauthorized",
  "sessionChanged",
  "invalidRequest",
  "unavailable",
  "timeout",
  "generic",
] as const;
