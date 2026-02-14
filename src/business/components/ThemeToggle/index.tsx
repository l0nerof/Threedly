"use client";

import { Button } from "@/src/shared/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/components/DropdownMenu";
import { Theme } from "@/src/shared/types/theme";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { themeOptions } from "../../constants/themeOptions";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const t = useTranslations("Header");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {theme === Theme.LIGHT && <Sun className="text-foreground size-5" />}
          {theme === Theme.DARK && <Moon className="text-foreground size-5" />}
          {theme === Theme.SYSTEM && (
            <Laptop className="text-foreground size-5" />
          )}

          <span className="sr-only">{t("theme.toggle")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {themeOptions.map(({ label, value, Icon }) => (
          <DropdownMenuItem
            key={value}
            className="text-foreground focus:text-primary focus:[&_svg]:text-primary flex cursor-pointer items-center gap-2 rounded-none px-4 py-2 text-base font-medium transition-colors duration-300 focus:bg-black/5 dark:focus:bg-white/5"
            onClick={() => {
              setTheme(value);
            }}
          >
            <Icon className="text-foreground size-5 transition-colors duration-300" />
            {t(label)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
