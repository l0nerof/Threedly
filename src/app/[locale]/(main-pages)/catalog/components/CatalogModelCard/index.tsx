"use client";

import ModelCardShell from "@/src/business/components/ModelCardShell";
import type { CatalogModel } from "@/src/business/types/catalog";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import { Download, Heart, ScanEye } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

type CatalogModelCardProps = {
  model: CatalogModel;
  locale: string;
};

function CatalogModelCard({ model, locale }: CatalogModelCardProps) {
  const t = useTranslations("Catalog.resultsArea");

  const title = locale === "ua" ? model.title_ua : model.title_en;

  return (
    <Link href={`/catalog/${model.slug}`} className="block">
      <ModelCardShell
        title={title}
        plan={model.minimum_plan}
        planLabel={t(`modelCard.planBadge.${model.minimum_plan}`)}
        formatLabel={model.file_format}
        meta={t("modelCard.downloads", { count: model.download_count })}
        interactive
        media={
          <>
            <Image
              src={model.cover_image_path}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 33vw"
            />
            <Button
              aria-label={t("modelCard.favoriteButton")}
              onClick={(e) => e.preventDefault()}
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white"
            >
              <Heart className="size-4" />
            </Button>
          </>
        }
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-xl" disabled>
              <ScanEye className="size-4" aria-hidden />
              {t("modelCard.previewButton")}
            </Button>
            <Button size="sm" className="rounded-xl" disabled>
              <Download className="size-4" aria-hidden />
              {t("modelCard.downloadButton")}
            </Button>
          </>
        }
      />
    </Link>
  );
}

export default CatalogModelCard;
