import ModelCardShell from "@/src/business/components/ModelCardShell";
import { PLAN_BADGE_COLORS } from "@/src/business/constants/catalogConfig";
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
        <ModelCardShell
          title={title}
          plan={model.minimum_plan}
          planLabel={model.minimum_plan}
          formatLabel={model.file_format}
          titleHeadingLevel={1}
          titleClassName="text-2xl sm:text-3xl"
          className="rounded-2xl p-6 sm:p-6"
          subtitle={
            <>
              {t("byPrefix")}{" "}
              <span className="text-foreground font-medium">{MOCK_AUTHOR}</span>
            </>
          }
          meta={
            <div className="flex items-center justify-between gap-3">
              <span>{t("downloads", { count: model.download_count })}</span>
              {updatedAt ? (
                <span>{t("updated", { date: updatedAt })}</span>
              ) : null}
            </div>
          }
          showActionsDivider
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled
              >
                <ScanEye className="size-4" aria-hidden />
                {t("previewButton")}
              </Button>
              <Button size="sm" className="rounded-xl" disabled>
                <Download className="size-4" aria-hidden />
                {t("downloadButton")}
              </Button>
            </>
          }
        />

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
