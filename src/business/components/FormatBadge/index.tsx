import { FORMAT_BADGE_COLORS } from "@/src/business/constants/catalogConfig";
import { Badge } from "@/src/shared/components/Badge/index";
import { cn } from "@/src/shared/utils/cn";

type FormatBadgeProps = {
  format: string;
  className?: string;
};

function FormatBadge({ format, className }: FormatBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md uppercase",
        FORMAT_BADGE_COLORS[format.toUpperCase()] ??
          "text-muted-foreground bg-muted",
        className,
      )}
    >
      {format}
    </Badge>
  );
}

export default FormatBadge;
