import ModelDetailOverview from "@/src/business/components/ModelDetailOverview";
import type { CatalogModel } from "@/src/business/types/catalog";
import { Link } from "@/src/i18n/routing";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

type OverviewTabProps = {
  model: CatalogModel;
  locale: string;
};

async function OverviewTab({ model, locale }: OverviewTabProps) {
  const t = await getTranslations("ModelPage.tabs");

  const description =
    locale === "ua" ? model.description_ua : model.description_en;
  const creator = model.creator;
  const creatorProfileHref = creator
    ? `/designers/${creator.username}?from=${encodeURIComponent(
        `/catalog/${model.slug}`,
      )}`
    : null;

  return (
    <ModelDetailOverview
      description={description}
      creator={creator}
      aboutTitle={t("aboutTitle")}
      aboutEmpty={t("aboutEmpty")}
      designerTitle={t("designerTitle")}
      creatorAction={
        creatorProfileHref ? (
          <Link
            href={creatorProfileHref}
            className="text-primary inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
          >
            {t("designerViewProfile")}
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        ) : null
      }
    />
  );
}

export default OverviewTab;
