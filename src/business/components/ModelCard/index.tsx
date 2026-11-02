"use client";

import DownloadModelButton from "@/src/business/components/DownloadModelButton";
import FavoriteModelButton from "@/src/business/components/FavoriteModelButton";
import ModelCardShell from "@/src/business/components/ModelCardShell";
import type { CatalogModel } from "@/src/business/types/catalog";
import { Button } from "@/src/shared/components/Button";
import { ScanEye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

type ModelCardProps = {
  className?: string;
  imageSizes?: string;
  linkClassName?: string;
  locale?: string;
  model: CatalogModel;
};

function ModelCard({
  className,
  imageSizes = "(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 33vw",
  linkClassName = "block",
  locale,
  model,
}: ModelCardProps) {
  const currentLocale = useLocale();
  const t = useTranslations("Catalog.resultsArea");
  const titleLocale = locale ?? currentLocale;
  const title = titleLocale === "ua" ? model.title_ua : model.title_en;

  return (
    <div className={linkClassName}>
      <ModelCardShell
        title={title}
        href={`/catalog/${model.slug}`}
        plan={model.minimum_plan}
        planLabel={t(`modelCard.planBadge.${model.minimum_plan}`)}
        formatLabel={model.file_format}
        meta={t("modelCard.downloads", { count: model.download_count })}
        interactive
        className={className}
        media={
          <>
            <Image
              src={model.cover_image_path}
              alt={title}
              fill
              className="object-cover"
              sizes={imageSizes}
            />
            <FavoriteModelButton
              modelId={model.id}
              className="absolute top-3 right-3 z-20"
            />
          </>
        }
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-xl" disabled>
              <ScanEye className="size-4" aria-hidden />
              {t("modelCard.previewButton")}
            </Button>
            <DownloadModelButton modelId={model.id} />
          </>
        }
      />
    </div>
  );
}

export default ModelCard;
