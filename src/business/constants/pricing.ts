import { BriefcaseBusiness, Sparkles, Zap } from "lucide-react";

export const planKeys = ["free", "pro", "business"] as const;

export type PlanKey = (typeof planKeys)[number];

export const featureKeysByPlan = {
  free: ["one", "two", "three", "four"] as const,
  pro: ["one", "two", "three", "four", "five"] as const,
  business: ["one", "two", "three", "four", "five", "six"] as const,
};

export const faqKeys = ["one", "two", "three", "four", "five"] as const;

export const pricingPlanMeta: Record<
  PlanKey,
  {
    icon: typeof Sparkles;
    buttonVariant: "default" | "secondary" | "outline";
    cardClassName: string;
    iconWrapClassName: string;
  }
> = {
  free: {
    icon: Sparkles,
    buttonVariant: "outline",
    cardClassName:
      "bg-surface/95 border-border/60 shadow-[0_18px_50px_hsl(var(--foreground)/0.06)]",
    iconWrapClassName: "bg-surface-elevated text-foreground border-border/60",
  },
  pro: {
    icon: Zap,
    buttonVariant: "default",
    cardClassName:
      "border-primary/35 bg-[linear-gradient(180deg,hsl(var(--primary)/0.10),hsl(var(--card)/0.95)_18%,hsl(var(--card)/0.9)_100%)] shadow-[0_24px_80px_hsl(var(--primary)/0.16)] lg:-translate-y-4",
    iconWrapClassName: "bg-primary/12 text-primary border-primary/20",
  },
  business: {
    icon: BriefcaseBusiness,
    buttonVariant: "outline",
    cardClassName:
      "bg-surface/95 border-border/60 shadow-[0_18px_50px_hsl(var(--foreground)/0.06)]",
    iconWrapClassName: "bg-surface-elevated text-foreground border-border/60",
  },
};
