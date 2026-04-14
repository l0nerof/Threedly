import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CatalogPage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // const t = await getTranslations("Pricing");

  return (
    <section className="bg-background text-foreground w-full">
      <div className="container flex flex-col gap-12 py-40">
        <h1>Catalog</h1>
      </div>
    </section>
  );
}
