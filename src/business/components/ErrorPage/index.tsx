"use client";

import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import TextType from "@/src/shared/components/TextType";
import { useTranslations } from "next-intl";

function ErrorPage() {
  const t = useTranslations("Errors");

  return (
    <main className="container flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.22em] uppercase">
          {t("badge")}
        </p>

        <TextType
          as="h1"
          text={t("title")}
          loop={false}
          showCursor={false}
          typingSpeed={35}
          className="text-3xl font-semibold sm:text-5xl"
        />

        <p className="text-muted-foreground text-base sm:text-lg">
          {t("description")}
        </p>

        <Button asChild size="lg">
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
    </main>
  );
}

export default ErrorPage;
