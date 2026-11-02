import { PLAN_LABELS } from "@/src/business/constants/plans";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Link } from "@/src/i18n/routing";
import { Badge } from "@/src/shared/components/Badge";
import { Button } from "@/src/shared/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import { Separator } from "@/src/shared/components/Separator";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { fetchProfileOverviewData } from "./actions";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const [t, result] = await Promise.all([
    getTranslations({ locale, namespace: "Profile" }),
    fetchProfileOverviewData(),
  ]);

  if (!result.ok) {
    if (result.error === "unauthorized") redirect(`/${locale}/login`);
    return (
      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("overview.title")}
        </h1>
        <p role="alert" className="text-destructive text-sm">
          {t(
            result.error === "timeout"
              ? "overview.loadTimeout"
              : "overview.loadError",
          )}
        </p>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/profile" prefetch={false}>
            {t("overview.retry")}
          </Link>
        </Button>
      </section>
    );
  }

  const { overview } = result;
  const numberFormatter = new Intl.NumberFormat(
    locale === "ua" ? "uk-UA" : "en-US",
  );
  const remaining = Math.max(
    overview.downloads_limit_monthly - overview.downloads_used_this_month,
    0,
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {t("overview.planBadge", { plan: PLAN_LABELS[overview.plan_key] })}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("overview.title")}
          </h1>
        </div>

        <Button asChild>
          <Link href="/catalog">{t("overview.primaryCta")}</Link>
        </Button>
      </div>
      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          role="group"
          aria-label={t("overview.stats.downloads.label")}
          className="border-border/60 gap-3 rounded-2xl p-5 shadow-none"
        >
          <CardHeader className="p-0">
            <CardDescription className="text-xs tracking-wide uppercase">
              {t("overview.stats.downloads.label")}
            </CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {numberFormatter.format(overview.downloads_used_this_month)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card
          role="group"
          aria-label={t("overview.stats.remaining.label")}
          className="border-border/60 gap-3 rounded-2xl p-5 shadow-none"
        >
          <CardHeader className="p-0">
            <CardDescription className="text-xs tracking-wide uppercase">
              {t("overview.stats.remaining.label")}
            </CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {numberFormatter.format(remaining)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card
          role="group"
          aria-label={t("overview.stats.uploads.label")}
          className="border-border/60 gap-3 rounded-2xl p-5 shadow-none"
        >
          <CardHeader className="p-0">
            <CardDescription className="text-xs tracking-wide uppercase">
              {t("overview.stats.uploads.label")}
            </CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {numberFormatter.format(overview.published_uploads)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card
          role="group"
          aria-label={t("overview.stats.favorites.label")}
          className="border-border/60 gap-3 rounded-2xl p-5 shadow-none"
        >
          <CardHeader className="p-0">
            <CardDescription className="text-xs tracking-wide uppercase">
              {t("overview.stats.favorites.label")}
            </CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {numberFormatter.format(overview.favorite_models)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/60 bg-muted/20 gap-4 rounded-2xl p-5 shadow-none">
          <CardHeader className="p-0">
            <CardTitle>{t("overview.continue.title")}</CardTitle>
            <CardDescription className="leading-6">
              {t("overview.continue.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Button asChild variant="outline">
              <Link href="/profile/library">{t("overview.continue.cta")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 gap-4 rounded-2xl p-5 shadow-none">
          <CardHeader className="p-0">
            <CardTitle>{t("overview.quota.title")}</CardTitle>
            <CardDescription className="leading-6">
              {t("overview.quota.description", {
                limit: numberFormatter.format(overview.downloads_limit_monthly),
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground text-sm leading-6">
              {t("overview.quota.rules")}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
