import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Link } from "@/src/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import AuthVisual from "./components/AuthVisual";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AuthLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <div className="bg-background min-h-svh">
      <div className="relative flex min-h-svh flex-col gap-6 lg:flex-row lg:gap-0">
        <div className="bg-muted relative hidden flex-1 lg:block">
          <AuthVisual />
        </div>
        <div
          aria-hidden
          className="via-background/20 to-background pointer-events-none absolute inset-y-0 left-1/2 hidden w-10 -translate-x-1/2 bg-linear-to-r from-transparent lg:block"
        />
        <div className="relative flex flex-1 items-center justify-center">
          <Link
            href="/"
            aria-label="Back to home"
            className="bg-muted/80 border-border/60 text-foreground/80 hover:text-foreground absolute top-6 left-6 flex size-10 items-center justify-center rounded-full border shadow-sm backdrop-blur transition"
          >
            <ArrowLeft className="size-4" />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
