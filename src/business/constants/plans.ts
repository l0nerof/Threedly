import type { Enums } from "@/src/business/types/database.generated";

export type MarketplacePlanKey = Enums<"plan_key">;

export const marketplacePlanKeys = [
  "free",
  "pro",
  "max",
] as const satisfies readonly MarketplacePlanKey[];

export const PLAN_BADGE_COLORS: Record<MarketplacePlanKey, string> = {
  free: "text-plan-free-text bg-plan-free-bg border-plan-free-text/20",
  pro: "text-plan-pro-text bg-plan-pro-bg border-plan-pro-text/20",
  max: "text-plan-max-text bg-plan-max-bg border-plan-max-text/20",
};

export const PLAN_LABELS: Record<MarketplacePlanKey, string> = {
  free: "Free",
  pro: "Pro",
  max: "Max",
};
