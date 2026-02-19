import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";
import { Button } from "@/src/shared/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import { Input } from "@/src/shared/components/Input";
import { Label } from "@/src/shared/components/Label";
import { Textarea } from "@/src/shared/components/Textarea";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { signOutAction } from "./actions";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProfileSettingsPage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Profile");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const signOutWithLocale = signOutAction.bind(null, locale);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("settings.subtitle")}
        </p>
      </div>

      <Card className="gap-4 p-4">
        <CardHeader className="p-0">
          <CardTitle>{t("settings.profile.title")}</CardTitle>
          <CardDescription>{t("settings.profile.description")}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 p-0">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display-name">
              {t("settings.profile.displayName")}
            </Label>
            <Input
              id="display-name"
              placeholder={t("settings.profile.displayName")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bio">{t("settings.profile.bio")}</Label>

            <Textarea
              id="bio"
              rows={4}
              placeholder={t("settings.profile.bioPlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t("settings.profile.email")}</Label>
            <Input id="email" value={user?.email ?? ""} readOnly />
          </div>
        </CardContent>
        <CardFooter className="p-0">
          <Button type="button" variant="outline">
            {t("settings.profile.save")}
          </Button>
        </CardFooter>
      </Card>

      <Card className="gap-4 p-4">
        <CardHeader className="p-0">
          <CardTitle>{t("settings.account.title")}</CardTitle>
          <CardDescription>{t("settings.account.description")}</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <form action={signOutWithLocale}>
            <Button type="submit" variant="destructive">
              {t("settings.account.signOut")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
