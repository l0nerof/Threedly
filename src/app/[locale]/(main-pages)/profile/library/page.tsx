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

export default async function ProfileLibraryPage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Profile");

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{t("library.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("library.subtitle")}</p>
      </div>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle>{t("library.empty.title")}</CardTitle>
          <CardDescription>{t("library.empty.description")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Button asChild>
            <Link href="/catalog">{t("library.primaryCta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
