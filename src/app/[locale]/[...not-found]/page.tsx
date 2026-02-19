import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleCatchAll({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  notFound();
}
