import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import FAQ from "./components/FAQ";
import PricingCards from "./components/PricingCards";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Pricing");

  return (
    <section className="bg-background text-foreground w-full">
      <div className="container flex flex-col gap-12 py-40">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <PricingCards />
        <FAQ />
      </div>
    </section>
  );
}
