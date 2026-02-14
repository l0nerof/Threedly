import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4 px-4 pt-28 pb-12">
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground text-sm">{t("description")}</p>
      <div className="bg-card border-border/60 rounded-xl border p-4">
        <p className="text-sm font-medium">{t("emailLabel")}</p>
        <p className="text-muted-foreground text-sm">
          {user?.email ?? t("emptyEmail")}
        </p>
      </div>
    </section>
  );
}
