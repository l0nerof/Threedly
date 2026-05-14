export {
  PLAN_BADGE_COLORS,
  marketplacePlanKeys as catalogPlanKeys,
} from "@/src/business/constants/plans";

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

export const FEATURED_MODELS_MIN_COUNT = 5;
