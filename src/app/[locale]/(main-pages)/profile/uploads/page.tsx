import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Link } from "@/src/i18n/routing";
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

export default async function ProfileUploadsPage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Profile");

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">{t("uploads.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("uploads.subtitle")}
          </p>
        </div>
        <Button>{t("uploads.uploadCta")}</Button>
      </div>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle>{t("uploads.empty.title")}</CardTitle>
          <CardDescription>{t("uploads.empty.description")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Button asChild variant="outline">
            <Link href="/profile/settings">{t("uploads.secondaryCta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
