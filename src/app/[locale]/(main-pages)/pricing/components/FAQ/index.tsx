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
    <section className="grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">{t("faqTitle")}</h2>
        <p className="text-muted-foreground text-sm">{t("faqSubtitle")}</p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqKeys.map((faqKey) => (
          <AccordionItem key={faqKey} value={faqKey}>
            <AccordionTrigger>{t(`faq.${faqKey}.question`)}</AccordionTrigger>
            <AccordionContent>{t(`faq.${faqKey}.answer`)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export default FAQ;
