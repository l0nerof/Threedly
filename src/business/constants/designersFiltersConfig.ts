import type {
  DesignerAccount,
  DesignerLevel,
  DesignerSortValue,
  DesignerSpecialization,
} from "@/src/business/types/designer";

export const SPECIALIZATION_LABELS: Record<DesignerSpecialization, string> = {
  furniture: "Furniture",
  decor: "Decor",
  materials: "Materials",
  lighting: "Lighting",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  exterior: "Exterior",
  plants: "Plants",
  technology: "Technology",
};

export const LEVEL_LABELS: Record<
  DesignerLevel,
  { label: string; description: string }
> = {
  free: { label: "Free", description: "Free plan creators" },
  pro: { label: "Pro", description: "Pro plan — can upload models" },
  max: { label: "Max", description: "Max plan — highest quota" },
};

export const ACCOUNT_LABELS: Record<
  DesignerAccount,
  { label: string; description: string }
> = {
  verified: { label: "Verified", description: "Identity confirmed." },
  pro: { label: "Pro members", description: "Pro-tier publishers." },
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
