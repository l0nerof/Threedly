"use client";

import ModelCardShell from "@/src/business/components/ModelCardShell";
import type { CatalogModel } from "@/src/business/types/catalog";
import { Link } from "@/src/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

type Props = {
  model: CatalogModel;
};

export default function FeaturedModelCard({ model }: Props) {
  const t = useTranslations("FeaturedModels");
  const locale = useLocale();
  const title = locale === "ua" ? model.title_ua : model.title_en;

  return (
    <Link href={`/catalog/${model.slug}`} className="block h-full">
      <ModelCardShell
        title={title}
        plan={model.minimum_plan}
        planLabel={t(`modelCard.planBadge.${model.minimum_plan}`)}
        formatLabel={model.file_format}
        meta={t("modelCard.downloads", { count: model.download_count })}
        interactive
        className="h-full"
        media={
          <Image
            src={model.cover_image_path}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        }
      />
    </Link>
  );
}
