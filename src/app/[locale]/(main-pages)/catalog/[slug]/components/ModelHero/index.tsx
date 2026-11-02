import DownloadModelButton from "@/src/business/components/DownloadModelButton";
import ModelDetailHero from "@/src/business/components/ModelDetailHero";
import type { CatalogModel } from "@/src/business/types/catalog";
import { Button } from "@/src/shared/components/Button";
import { ScanEye } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

type ModelHeroProps = {
  model: CatalogModel;
  locale: string;
};

function formatUpdatedAt(
  dateValue: string | null,
  locale: string,
): string | null {
  if (!dateValue) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "ua" ? "uk-UA" : "en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

async function ModelHero({ model, locale }: ModelHeroProps) {
  const t = await getTranslations("ModelPage.hero");

  const title = locale === "ua" ? model.title_ua : model.title_en;
  const updatedAt = formatUpdatedAt(model.published_at, locale);

  return (
    <ModelDetailHero
      title={title}
      plan={model.minimum_plan}
      format={model.file_format}
      specificationsTitle={t("specificationsTitle")}
      planInfo={t("planInfo", { plan: model.minimum_plan })}
      media={
        <Image
          src={model.cover_image_path}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
        />
      }
      meta={
        <div className="flex items-center justify-between gap-3">
          <span>{t("downloads", { count: model.download_count })}</span>
          {updatedAt ? <span>{t("updated", { date: updatedAt })}</span> : null}
        </div>
      }
      actions={
        <>
          <Button variant="outline" size="sm" className="rounded-xl" disabled>
            <ScanEye className="size-4" aria-hidden />
            {t("previewButton")}
          </Button>
          <DownloadModelButton modelId={model.id} />
        </>
      }
    />
  );
}

export default ModelHero;
