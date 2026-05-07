import { FORMAT_BADGE_COLORS } from "@/src/business/constants/catalogConfig";
import { cn } from "@/src/shared/utils/cn";

type FormatBadgeProps = {
  format: string;
  className?: string;
};

function FormatBadge({ format, className }: FormatBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase",
        FORMAT_BADGE_COLORS[format.toUpperCase()] ??
          "text-muted-foreground bg-muted",
        className,
      )}
    >
      {format}
    </span>
  );
}

export default FormatBadge;
