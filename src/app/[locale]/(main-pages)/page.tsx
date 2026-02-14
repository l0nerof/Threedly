import FinalCta from "@/src/business/components/FinalCta";
import ForWho from "@/src/business/components/ForWho";
import Hero from "@/src/business/components/Hero";
import HowItWorks from "@/src/business/components/HowItWorks";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <ForWho />
      <HowItWorks />
      <FinalCta />
    </>
  );
}
