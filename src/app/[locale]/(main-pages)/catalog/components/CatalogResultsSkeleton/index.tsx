import { Separator } from "@/src/shared/components/Separator";
import { Skeleton } from "@/src/shared/components/Skeleton";
import { useTranslations } from "next-intl";

const cardHeights = ["h-64", "h-56", "h-60", "h-52", "h-64", "h-56"] as const;

function CatalogResultsSkeleton() {
  const t = useTranslations("Catalog");

  return (
    <section
      aria-label={t("resultsArea.ariaLabel")}
      className="border-border/60 bg-surface/95 flex flex-col gap-6 rounded-4xl border p-5 shadow-[0_28px_100px_hsl(var(--foreground)/0.08)] backdrop-blur-xl sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("resultsArea.title")}
          </h2>
          <p className="text-muted-foreground text-sm leading-6 sm:text-base">
            {t("resultsArea.description")}
          </p>
        </div>

        <div className="border-border/60 text-muted-foreground inline-flex items-center rounded-full border px-3 py-1.5 text-xs tracking-[0.12em] uppercase">
          {t("resultsArea.paginationLabel")}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {cardHeights.map((cardHeight, index) => (
          <article
            key={`${cardHeight}-${index}`}
            className="border-border/60 bg-surface-elevated/95 flex flex-col gap-4 rounded-[1.65rem] border p-4 sm:p-5"
          >
            <Skeleton className={`${cardHeight} rounded-[1.25rem]`} />

            <div className="flex flex-col gap-3">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-6 w-4/5 rounded-lg" />
              <Skeleton className="h-4 w-3/5" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
          </article>
        ))}
      </div>

      <Separator />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-12 rounded-full" />
          <Skeleton className="h-10 w-12 rounded-full" />
          <Skeleton className="h-10 w-12 rounded-full" />
        </div>

        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
    </section>
  );
}

export default CatalogResultsSkeleton;
