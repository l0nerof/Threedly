import Footer from "@/src/business/components/Footer";
import Header from "@/src/business/components/Header";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function MainPagesLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
