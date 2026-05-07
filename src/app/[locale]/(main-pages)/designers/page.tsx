import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import DesignersShell from "./components/DesignersShell";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    return {};
  }

  return {
    title: locale === "ua" ? "Дизайнери — Threedly" : "Designers — Threedly",
    description:
      locale === "ua"
        ? "Познайомтесь із авторами 3D-моделей на Threedly."
        : "Meet the creators behind every model on Threedly.",
  };
}

export default async function DesignersPage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <DesignersShell />;
}
