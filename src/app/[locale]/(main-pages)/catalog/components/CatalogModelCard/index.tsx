import type { CatalogModel } from "@/src/business/types/catalog";
import { Button } from "@/src/shared/components/Button";
import { Download, ScanEye } from "lucide-react";
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
    <article className="border-border/60 bg-surface-elevated/80 flex flex-col gap-4 rounded-[1.65rem] border p-4 sm:p-5">
      <div className="bg-muted/100 relative h-60 overflow-hidden rounded-[1.25rem]">
        <Image
          src={model.cover_image_path}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground border-border/60 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase">
            {t(`modelCard.planBadge.${model.minimum_plan}`)}
          </span>
          {model.file_format && (
            <span className="text-muted-foreground text-xs uppercase">
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
    </article>
  );
}

export default CatalogModelCard;
