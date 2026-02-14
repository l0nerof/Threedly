import { Theme } from "@/src/shared/types/theme";
import { Laptop, Moon, Sun } from "lucide-react";

export const themeOptions = [
  {
    label: "theme.light",
    value: Theme.LIGHT,
    Icon: Sun,
  },
  {
    label: "theme.dark",
    value: Theme.DARK,
    Icon: Moon,
  },
  {
    label: "theme.system",
    value: Theme.SYSTEM,
    Icon: Laptop,
  },
];
