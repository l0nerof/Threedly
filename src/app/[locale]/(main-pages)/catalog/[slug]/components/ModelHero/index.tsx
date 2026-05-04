import {
  FORMAT_BADGE_COLORS,
  PLAN_BADGE_COLORS,
} from "@/src/business/constants/catalogConfig";
import type { CatalogModel } from "@/src/business/types/catalog";
import { Button } from "@/src/shared/components/Button";
import { Download, Info, ScanEye } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

const MOCK_AUTHOR = "Studio Arc";

type ModelHeroProps = {
  model: CatalogModel;
  locale: string;
};

async function ModelHero({ model, locale }: ModelHeroProps) {
  const t = await getTranslations("ModelPage.hero");

  const title = locale === "ua" ? model.title_ua : model.title_en;

  const updatedAt = model.published_at
    ? new Date(model.published_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[5fr_3fr]">
      <div className="bg-muted relative min-h-[480px] overflow-hidden rounded-2xl">
        <Image
          src={model.cover_image_path}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-surface-elevated flex flex-col gap-3.5 rounded-2xl p-6">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase ${PLAN_BADGE_COLORS[model.minimum_plan] ?? "text-muted-foreground bg-muted"}`}
            >
              {model.minimum_plan}
            </span>
            {model.file_format && (
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase ${FORMAT_BADGE_COLORS[model.file_format.toUpperCase()] ?? "text-muted-foreground bg-muted"}`}
              >
                {model.file_format}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("byPrefix")}{" "}
              <span className="text-foreground font-medium">{MOCK_AUTHOR}</span>
            </p>
          </div>

          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>{t("downloads", { count: model.download_count })}</span>
            {updatedAt && <span>{t("updated", { date: updatedAt })}</span>}
          </div>

          <div className="border-border/60 border-t" />

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" disabled>
              <ScanEye className="size-4" aria-hidden />
              {t("previewButton")}
            </Button>
            <Button size="sm" className="rounded-xl" disabled>
              <Download className="size-4" aria-hidden />
              {t("downloadButton")}
            </Button>
          </div>
        </div>

        <div className="bg-surface-elevated flex flex-col gap-3 rounded-2xl p-6">
          <h2 className="text-base font-semibold">
            {t("specificationsTitle")}
          </h2>
        </div>

        <div
          className={`flex items-start gap-[10px] rounded-[10px] border px-4 py-3 ${PLAN_BADGE_COLORS[model.minimum_plan] ?? "text-muted-foreground bg-muted border-border/60"}`}
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-sm">
            {t("planInfo", { plan: model.minimum_plan })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ModelHero;
