import type { CatalogModel } from "@/src/business/types/catalog";
import { Link } from "@/src/i18n/routing";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

const MOCK_DESIGNER = {
  name: "Anna Kovalenko",
  username: "anna_kovalenko",
  avatarUrl: "",
};

type OverviewTabProps = {
  model: CatalogModel;
  locale: string;
};

async function OverviewTab({ model, locale }: OverviewTabProps) {
  const t = await getTranslations("ModelPage.tabs");

  const description =
    locale === "ua" ? model.description_ua : model.description_en;

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
        <div className="flex items-center gap-3">
          <div className="bg-muted size-10 shrink-0 overflow-hidden rounded-full">
            {MOCK_DESIGNER.avatarUrl && (
              <Image
                src={MOCK_DESIGNER.avatarUrl}
                alt={MOCK_DESIGNER.name}
                width={40}
                height={40}
                className="object-cover"
              />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">
              {MOCK_DESIGNER.name}
            </span>
            <Link
              href={`/designers/${MOCK_DESIGNER.username}`}
              className="text-primary inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
            >
              {t("designerViewProfile")}
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;
