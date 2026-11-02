import ModelCardShell from "@/src/business/components/ModelCardShell";
import { PLAN_BADGE_COLORS } from "@/src/business/constants/catalogConfig";
import type { CatalogPlanKey } from "@/src/business/types/catalog";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  plan: CatalogPlanKey;
  format: string | null;
  media: ReactNode;
  meta?: ReactNode;
  actions: ReactNode;
  specificationsTitle: string;
  planInfo: string;
};

export default function ModelDetailHero({
  title,
  plan,
  format,
  media,
  meta,
  actions,
  specificationsTitle,
  planInfo,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[5fr_3fr]">
      <div className="bg-muted relative min-h-[480px] overflow-hidden rounded-2xl">
        {media}
      </div>
      <div className="flex flex-col gap-4">
        <ModelCardShell
          title={title}
          plan={plan}
          planLabel={plan}
          formatLabel={format}
          titleHeadingLevel={1}
          titleClassName="text-2xl sm:text-3xl"
          className="rounded-2xl p-6 sm:p-6"
          meta={meta}
          showActionsDivider
          actions={actions}
        />
        <div className="bg-surface-elevated flex flex-col gap-3 rounded-2xl p-6">
          <h2 className="text-base font-semibold">{specificationsTitle}</h2>
        </div>
        <div
          className={`flex items-start gap-[10px] rounded-[10px] border px-4 py-3 ${PLAN_BADGE_COLORS[plan] ?? "text-muted-foreground bg-muted border-border/60"}`}
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-sm">{planInfo}</p>
        </div>
      </div>
    </div>
  );
}
