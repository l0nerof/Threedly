import { PLAN_BADGE_COLORS } from "@/src/business/constants/catalogConfig";
import { cn } from "@/src/shared/utils/cn";

type PlanBadgeProps = {
  plan: string;
  label?: string;
  className?: string;
};

function PlanBadge({ plan, label, className }: PlanBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase",
        PLAN_BADGE_COLORS[plan] ?? "text-muted-foreground bg-muted",
        className,
      )}
    >
      {label ?? plan}
    </span>
  );
}

export default PlanBadge;
