export const DESIGNERS_PAGE_SIZE = 9;

export const DESIGNERS_SEARCH_MIN_CHARS = 2;
export const DESIGNERS_SEARCH_DEBOUNCE_MS = 350;

export const DESIGNER_PLAN_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  free: {
    label: "Free",
    className: "text-plan-free-text bg-plan-free-bg border-plan-free-text/20",
  },
  pro: {
    label: "Pro",
    className: "text-plan-pro-text bg-plan-pro-bg border-plan-pro-text/20",
  },
  max: {
    label: "Max",
    className: "text-plan-max-text bg-plan-max-bg border-plan-max-text/20",
  },
};
