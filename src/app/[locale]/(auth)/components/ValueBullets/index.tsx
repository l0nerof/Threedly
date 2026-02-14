import { Badge } from "@/src/shared/components/Badge";
import type { LucideIcon } from "lucide-react";

export type ValueBullet = {
  icon: LucideIcon;
  label: string;
  isBeta?: boolean;
  betaLabel?: string;
};

type ValueBulletsProps = {
  valueBullets: ValueBullet[];
};

function ValueBullets({ valueBullets }: ValueBulletsProps) {
  return (
    <ul className="text-foreground/70 flex flex-col gap-2 text-sm">
      {valueBullets.map(({ icon: Icon, label, isBeta, betaLabel }) => (
        <li key={label} className="flex items-center gap-2">
          <Icon className="text-primary/80 size-4" />
          <span>{label}</span>

          {isBeta && (
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary h-5 rounded-sm px-2 text-xs font-medium"
            >
              {betaLabel ?? "beta"}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  );
}

export default ValueBullets;
