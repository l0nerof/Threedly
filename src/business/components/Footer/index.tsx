"use client";

import { Link } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "../LanguageToggle";
import { ThemeToggle } from "../ThemeToggle";

function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="w-full border-t py-6 md:py-12">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-muted-foreground text-center text-sm leading-loose md:text-left">
          {t("copyright")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
          <div className="flex gap-4">
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-primary text-sm transition-colors duration-300"
            >
              {t("terms")}
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-primary text-sm transition-colors duration-300"
            >
              {t("privacy")}
            </Link>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
