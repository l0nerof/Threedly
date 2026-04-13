import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Badge } from "@/src/shared/components/Badge";
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
    <section className="bg-background text-foreground relative w-full overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_center,hsl(var(--primary)/0.16),transparent_50%)]"
      />

      <div className="relative container flex flex-col gap-14 py-32 sm:gap-16 sm:py-40">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary rounded-full px-4 py-1.5 text-[0.72rem] tracking-[0.16em] uppercase"
          >
            {t("eyebrow")}
          </Badge>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              {t("titleStart")}{" "}
              <span className="font-serif italic">{t("titleAccent")}</span>{" "}
              {t("titleEnd")}
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-7 sm:text-lg">
              {t("subtitle")}
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3">
            {["one", "two", "three"].map((itemKey) => (
              <div
                key={itemKey}
                className="border-border/60 bg-card/60 rounded-[1.4rem] border px-4 py-4 text-left shadow-[inset_0_1px_0_hsl(var(--foreground)/0.03)] backdrop-blur-sm"
              >
                <p className="text-muted-foreground text-[0.72rem] font-medium tracking-[0.14em] uppercase">
                  {t(`highlights.${itemKey}.label`)}
                </p>
                <p className="mt-3 text-sm leading-6 font-medium sm:text-base">
                  {t(`highlights.${itemKey}.value`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <PricingCards />
        <FAQ />
      </div>
    </section>
  );
}
