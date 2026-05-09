import type {
  SectionHeadingIcon,
  SectionHeadingVariant,
} from "@/src/business/types/upload";
import { cn } from "@/src/shared/utils/cn";

type SectionHeadingProps = {
  icon: SectionHeadingIcon;
  title: string;
  variant?: SectionHeadingVariant;
};

function SectionHeading({
  icon: Icon,
  title,
  variant = "primary",
}: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-xl",
          variant === "primary" && "bg-primary/10 text-primary",
          variant === "accent" && "bg-accent text-accent-foreground",
          variant === "secondary" && "bg-secondary text-secondary-foreground",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
  );
}

export default SectionHeading;
