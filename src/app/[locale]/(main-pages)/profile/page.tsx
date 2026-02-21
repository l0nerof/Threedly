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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">{t("overview.title")}</h1>
          <Badge variant="outline">{t("overview.planBadge")}</Badge>
        </div>

        <Button asChild>
          <Link href="/catalog">{t("overview.primaryCta")}</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="gap-2 p-4">
          <CardHeader className="p-0">
            <CardDescription>
              {t("overview.stats.downloads.label")}
            </CardDescription>
            <CardTitle>{t("overview.stats.downloads.value")}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="gap-2 p-4">
          <CardHeader className="p-0">
            <CardDescription>
              {t("overview.stats.remaining.label")}
            </CardDescription>
            <CardTitle>{t("overview.stats.remaining.value")}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="gap-2 p-4">
          <CardHeader className="p-0">
            <CardDescription>
              {t("overview.stats.uploads.label")}
            </CardDescription>
            <CardTitle>{t("overview.stats.uploads.value")}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="gap-2 p-4">
          <CardHeader className="p-0">
            <CardDescription>
              {t("overview.stats.favorites.label")}
            </CardDescription>
            <CardTitle>{t("overview.stats.favorites.value")}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-3 p-4">
          <CardHeader className="p-0">
            <CardTitle>{t("overview.continue.title")}</CardTitle>
            <CardDescription>
              {t("overview.continue.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Button asChild variant="outline">
              <Link href="/catalog">{t("overview.continue.cta")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="gap-3 p-4">
          <CardHeader className="p-0">
            <CardTitle>{t("overview.activity.title")}</CardTitle>
            <CardDescription>
              {t("overview.activity.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground text-sm">
              {t("overview.activity.placeholder")}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
