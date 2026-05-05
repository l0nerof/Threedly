export const catalogPlanKeys = ["free", "pro", "max"] as const;

export const PLAN_BADGE_COLORS: Record<string, string> = {
  free: "text-plan-free-text bg-plan-free-bg border-plan-free-text/20",
  pro: "text-plan-pro-text bg-plan-pro-bg border-plan-pro-text/20",
  max: "text-plan-max-text bg-plan-max-bg border-plan-max-text/20",
};

export const FORMAT_BADGE_COLORS: Record<string, string> = {
  GLB: "text-format-glb-text bg-format-glb-bg",
  FBX: "text-format-fbx-text bg-format-fbx-bg",
  OBJ: "text-format-obj-text bg-format-obj-bg",
};

export const catalogFormatValues = ["glb", "fbx", "max"] as const;

export const catalogSortValues = ["curated", "fresh", "downloads"] as const;

export const CATALOG_PAGE_SIZE = 9;

export const CATALOG_SEARCH_MIN_CHARS = 2;
export const CATALOG_SEARCH_DEBOUNCE_MS = 350;
