"use client";

import {
  FORMAT_BADGE_COLORS,
  PLAN_BADGE_COLORS,
} from "@/src/business/constants/catalogConfig";
import type { CatalogModel } from "@/src/business/types/catalog";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import { cn } from "@/src/shared/utils/cn";
import { Download, Heart, ScanEye } from "lucide-react";
import { motion } from "motion/react";
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
      <motion.article
        className="border-border/60 bg-surface-elevated/80 flex flex-col gap-4 rounded-[1.65rem] border p-4 sm:p-5"
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="bg-muted relative h-60 overflow-hidden rounded-[1.25rem]">
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
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase",
                PLAN_BADGE_COLORS[model.minimum_plan] ??
                  "text-muted-foreground bg-muted",
              )}
            >
              {t(`modelCard.planBadge.${model.minimum_plan}`)}
            </span>
            {model.file_format && (
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase",
                  FORMAT_BADGE_COLORS[model.file_format.toUpperCase()] ??
                    "text-muted-foreground bg-muted",
                )}
              >
                {model.file_format}
              </span>
            )}
          </div>

          <h3 className="text-base leading-snug font-semibold tracking-tight sm:text-lg">
            {title}
          </h3>

          <p className="text-muted-foreground text-sm">
            {t("modelCard.downloads", { count: model.download_count })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" disabled>
            <ScanEye className="size-4" aria-hidden />
            {t("modelCard.previewButton")}
          </Button>
          <Button size="sm" className="rounded-xl" disabled>
            <Download className="size-4" aria-hidden />
            {t("modelCard.downloadButton")}
          </Button>
        </div>
      </motion.article>
    </Link>
  );
}

export default CatalogModelCard;
