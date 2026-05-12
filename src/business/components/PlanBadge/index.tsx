import { PLAN_BADGE_COLORS } from "@/src/business/constants/catalogConfig";
import type { MarketplacePlanKey } from "@/src/business/constants/plans";
import { Badge } from "@/src/shared/components/Badge/index";
import { cn } from "@/src/shared/utils/cn";

type PlanBadgeProps = {
  plan: MarketplacePlanKey;
  label?: string;
  className?: string;
};

function PlanBadge({ plan, label, className }: PlanBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "tracking-wide uppercase",
        PLAN_BADGE_COLORS[plan],
        className,
      )}
    >
      {label ?? plan}
    </Badge>
  );
}

export default PlanBadge;
