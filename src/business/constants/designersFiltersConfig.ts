import type {
  DesignerLevel,
  DesignerSortValue,
} from "@/src/business/types/designer";

export const LEVEL_LABELS: Record<
  DesignerLevel,
  { label: string; description: string }
> = {
  free: { label: "Free", description: "Free plan creators" },
  pro: { label: "Pro", description: "Pro plan — can upload models" },
  max: { label: "Max", description: "Max plan — highest quota" },
};

export const SORT_LABELS: Record<DesignerSortValue, string> = {
  popular: "Most popular",
  newest: "Newest",
  models: "Most models",
};

export type DesignerTab = "all" | "featured" | "rising" | "new" | "following";

export const DESIGNER_TABS: { value: DesignerTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "featured", label: "Featured" },
  { value: "rising", label: "Rising" },
  { value: "new", label: "New" },
  { value: "following", label: "Following" },
];
