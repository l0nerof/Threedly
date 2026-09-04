import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Badge } from "@/src/shared/components/Badge";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { fetchProfileLibraryData } from "./actions";
import ProfileLibraryTabs from "./components/ProfileLibraryTabs";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProfileLibraryPage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Profile");
  const libraryData = await fetchProfileLibraryData();

  if (!libraryData) {
    notFound();
  }

  const libraryStats = [
    {
      label: t("library.stats.downloaded"),
      value: libraryData.downloadedModels.length,
    },
    {
      label: t("library.stats.favoriteModels"),
      value: libraryData.favoriteModels.length,
    },
    {
      label: t("library.stats.subscriptions"),
      value: libraryData.followedDesigners.length,
    },
  ];

  return (
    <section className="flex flex-col gap-6">
      <div className="border-border/60 bg-surface/80 relative isolate overflow-hidden rounded-3xl border p-5 shadow-sm sm:p-7">
        <div
          aria-hidden
          className="from-primary/18 via-accent/18 absolute inset-0 bg-linear-to-br to-transparent"
        />
        <div
          aria-hidden
          className="bg-primary/10 absolute -top-20 right-10 size-56 rounded-full blur-3xl"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-3">
            <Badge
              variant="outline"
              className="bg-background/55 w-fit rounded-full px-3 py-1 backdrop-blur"
            >
              {t("library.badge")}
            </Badge>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("library.title")}
              </h1>
              <p className="text-muted-foreground text-sm leading-6 sm:text-base">
                {t("library.subtitle")}
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-96">
            {libraryStats.map((stat) => (
              <div
                key={stat.label}
                className="border-border/60 bg-background/55 rounded-2xl border px-4 py-3 backdrop-blur"
              >
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-muted-foreground text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProfileLibraryTabs {...libraryData} locale={locale} />
    </section>
  );
}
