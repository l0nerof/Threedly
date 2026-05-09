import { PLAN_BADGE_COLORS } from "@/src/business/constants/catalogConfig";
import { Badge } from "@/src/shared/components/Badge/index";
import { cn } from "@/src/shared/utils/cn";

type PlanBadgeProps = {
  plan: string;
  label?: string;
  className?: string;
};

function PlanBadge({ plan, label, className }: PlanBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "tracking-wide uppercase",
        PLAN_BADGE_COLORS[plan] ?? "text-muted-foreground bg-muted",
        className,
      )}
    >
      {label ?? plan}
    </Badge>
  );
}

export default PlanBadge;
