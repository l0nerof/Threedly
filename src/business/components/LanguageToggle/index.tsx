"use client";

import { usePathname, useRouter } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/components/DropdownMenu";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { localeOptions } from "../../constants/localeOptions";

export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Header");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Globe className="text-foreground size-5" />
          <span className="sr-only">{t("language.toggle")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {localeOptions.map(({ value, label }) => (
          <DropdownMenuItem
            key={value}
            className="text-foreground focus:text-primary flex cursor-pointer items-center gap-2 rounded-none px-4 py-2 text-base font-medium transition-colors duration-300 focus:bg-black/5 dark:focus:bg-white/5"
            onClick={() => {
              if (locale !== value) {
                router.replace(pathname, { locale: value });
              }
            }}
          >
            {t(label)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
