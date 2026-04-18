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
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Profile");

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {t("overview.planBadge")}
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
        <Card className="border-border/60 gap-3 rounded-2xl p-5 shadow-none">
          <CardHeader className="p-0">
            <CardDescription className="text-xs tracking-wide uppercase">
              {t("overview.stats.downloads.label")}
            </CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {t("overview.stats.downloads.value")}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/60 gap-3 rounded-2xl p-5 shadow-none">
          <CardHeader className="p-0">
            <CardDescription className="text-xs tracking-wide uppercase">
              {t("overview.stats.remaining.label")}
            </CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {t("overview.stats.remaining.value")}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/60 gap-3 rounded-2xl p-5 shadow-none">
          <CardHeader className="p-0">
            <CardDescription className="text-xs tracking-wide uppercase">
              {t("overview.stats.uploads.label")}
            </CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {t("overview.stats.uploads.value")}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/60 gap-3 rounded-2xl p-5 shadow-none">
          <CardHeader className="p-0">
            <CardDescription className="text-xs tracking-wide uppercase">
              {t("overview.stats.favorites.label")}
            </CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {t("overview.stats.favorites.value")}
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
              <Link href="/catalog">{t("overview.continue.cta")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 gap-4 rounded-2xl p-5 shadow-none">
          <CardHeader className="p-0">
            <CardTitle>{t("overview.activity.title")}</CardTitle>
            <CardDescription className="leading-6">
              {t("overview.activity.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground text-sm leading-6">
              {t("overview.activity.placeholder")}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
