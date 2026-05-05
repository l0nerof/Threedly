import { fetchCatalogModels } from "@/src/app/[locale]/(main-pages)/catalog/actions";
import CatalogModelCard from "@/src/app/[locale]/(main-pages)/catalog/components/CatalogModelCard";
import { Link } from "@/src/i18n/routing";
import { ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

type RelatedModelsProps = {
  currentSlug: string;
};

async function RelatedModels({ currentSlug }: RelatedModelsProps) {
  const t = await getTranslations("ModelPage.relatedModels");
  const locale = await getLocale();

  const { models } = await fetchCatalogModels({ page: 1, sort: "curated" });

  const related = models.filter((m) => m.slug !== currentSlug).slice(0, 4);

  if (related.length === 0) {
    return null;
  }

  return (
    <section aria-label={t("ariaLabel")} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h2>
        <Link
          href="/catalog"
          className="text-primary hover:text-primary/70 inline-flex items-center gap-1 text-sm font-medium"
        >
          {t("viewAll")}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {related.map((model) => (
          <CatalogModelCard key={model.id} model={model} locale={locale} />
        ))}
      </div>
    </section>
  );
}

export default RelatedModels;
