import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

export default async function DesignerPage({ params }: Props) {
  const { locale, username } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // const t = await getTranslations("Pricing");

  return (
    <section className="bg-background text-foreground w-full">
      <div className="container flex flex-col gap-12 py-40">
        <h1>Designer: {username}</h1>
      </div>
    </section>
  );
}
