import { PLAN_BADGE_COLORS, PLAN_LABELS } from "@/src/business/constants/plans";
import type { DesignerLevel } from "@/src/business/types/designer";

export const DESIGNERS_PAGE_SIZE = 9;
export const DESIGNER_PROFILE_MODELS_LIMIT = 6;

export const DESIGNERS_SEARCH_MIN_CHARS = 2;
export const DESIGNERS_SEARCH_DEBOUNCE_MS = 350;

export const DESIGNER_PLAN_BADGE: Record<
  DesignerLevel,
  { label: string; className: string }
> = {
  free: {
    label: PLAN_LABELS.free,
    className: PLAN_BADGE_COLORS.free,
  },
  pro: {
    label: PLAN_LABELS.pro,
    className: PLAN_BADGE_COLORS.pro,
  },
  max: {
    label: PLAN_LABELS.max,
    className: PLAN_BADGE_COLORS.max,
  },
};
