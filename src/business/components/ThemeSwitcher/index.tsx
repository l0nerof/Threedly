"use client";

import { Button } from "@/shared/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/DropdownMenu";
import { Theme } from "@/shared/types/theme";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const themeOptions = [
  {
    label: "Світла",
    value: Theme.LIGHT,
    Icon: Sun,
  },
  {
    label: "Темна",
    value: Theme.DARK,
    Icon: Moon,
  },
  {
    label: "Системна",
    value: Theme.SYSTEM,
    Icon: Laptop,
  },
];

function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="focus-visible:ring-0">
          {theme === Theme.LIGHT && (
            <Sun className="text-font-primary size-5" />
          )}
          {theme === Theme.DARK && (
            <Moon className="text-font-primary size-5" />
          )}
          {theme === Theme.SYSTEM && (
            <Laptop className="text-font-primary size-5" />
          )}

          <span className="sr-only">Змінити тему</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeOptions.map(({ label, value, Icon }) => (
          <DropdownMenuItem
            key={value}
            className="text-font-primary flex cursor-pointer items-center gap-2 rounded-none px-4 py-2 text-base font-medium transition-colors duration-300 focus:bg-black/5 dark:focus:bg-white/5"
            onClick={() => {
              setTheme(value);
            }}
          >
            <Icon className="text-font-primary size-5" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeSwitcher;
