import type { CatalogModel } from "@/src/business/types/catalog";
import { Link } from "@/src/i18n/routing";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

type OverviewTabProps = {
  model: CatalogModel;
  locale: string;
};

async function OverviewTab({ model, locale }: OverviewTabProps) {
  const t = await getTranslations("ModelPage.tabs");

  const description =
    locale === "ua" ? model.description_ua : model.description_en;
  const creator = model.creator;
  const creatorInitials = creator?.username.slice(0, 2).toUpperCase();
  const creatorProfileHref = creator
    ? `/designers/${creator.username}?from=${encodeURIComponent(
        `/catalog/${model.slug}`,
      )}`
    : null;

  return (
    <div className="grid items-start gap-8 p-6 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-[10px]">
        <h2 className="text-lg font-semibold">{t("aboutTitle")}</h2>
        {description ? (
          <div className="text-muted-foreground flex flex-col gap-3 text-sm leading-relaxed">
            {description.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("aboutEmpty")}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("designerTitle")}</h2>
        {creator && creatorProfileHref ? (
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
              {creator.avatar_path ? (
                <Image
                  src={creator.avatar_path}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <span className="text-xs font-semibold">{creatorInitials}</span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">
                @{creator.username}
              </span>
              <Link
                href={creatorProfileHref}
                className="text-primary inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
              >
                {t("designerViewProfile")}
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default OverviewTab;
