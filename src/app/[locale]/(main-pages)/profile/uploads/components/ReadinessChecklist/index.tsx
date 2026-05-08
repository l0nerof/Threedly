import type { ReadinessItem } from "@/src/business/types/upload";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";

type ReadinessChecklistProps = {
  title: string;
  items: ReadinessItem[];
  completeLabel: string;
  missingLabel: string;
};

function ReadinessChecklist({
  title,
  items,
  completeLabel,
  missingLabel,
}: ReadinessChecklistProps) {
  return (
    <div className="border-border/60 bg-background/70 flex flex-col gap-3 rounded-3xl border p-4 shadow-xs">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2">
              {item.isComplete ? (
                <CheckCircle2Icon className="text-primary size-4" aria-hidden />
              ) : (
                <CircleIcon
                  className="text-muted-foreground/45 size-4"
                  aria-hidden
                />
              )}
              {item.label}
            </span>
            <span className="text-muted-foreground text-xs">
              {item.isComplete ? completeLabel : missingLabel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ReadinessChecklist;
