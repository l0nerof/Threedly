import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { SidebarInset, SidebarProvider } from "@/src/shared/components/Sidebar";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { ProfileSidebar } from "./components/ProfileSidebar";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProfileLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <section className="container w-full pt-28 pb-8">
      <SidebarProvider className="flex min-h-[calc(100svh-14rem)] flex-col items-center gap-6 md:flex-row md:items-start">
        <ProfileSidebar />
        <SidebarInset className="bg-transparent">{children}</SidebarInset>
      </SidebarProvider>
    </section>
  );
}
