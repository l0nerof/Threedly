import { faqKeys } from "@/src/business/constants/pricing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/shared/components/Accordion";
import { getTranslations } from "next-intl/server";

async function FAQ() {
  const t = await getTranslations("Pricing");

  return (
    <section className="border-border/60 bg-surface/88 grid gap-8 rounded-4xl border p-6 shadow-[0_18px_50px_hsl(var(--foreground)/0.06)] sm:p-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <p className="text-primary text-xs font-medium tracking-[0.18em] uppercase">
            {t("faqEyebrow")}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {t("faqTitle")}
          </h2>
          <p className="text-muted-foreground text-sm leading-7 sm:text-base">
            {t("faqSubtitle")}
          </p>
        </div>

        <div className="border-border/60 bg-surface/90 rounded-3xl border p-4">
          <p className="text-sm leading-7">{t("faqNote")}</p>
        </div>
      </div>

      <Accordion
        type="single"
        collapsible
        className="border-border/60 bg-surface/90 w-full rounded-3xl border px-5 sm:px-6"
      >
        {faqKeys.map((faqKey) => (
          <AccordionItem
            key={faqKey}
            value={faqKey}
            className="border-border/60"
          >
            <AccordionTrigger>{t(`faq.${faqKey}.question`)}</AccordionTrigger>
            <AccordionContent>{t(`faq.${faqKey}.answer`)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export default FAQ;
