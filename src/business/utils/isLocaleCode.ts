import { routing } from "@/src/i18n/routing";
import { LocaleCode } from "../constants/localization";

export const isLocaleCode = (value: string): value is LocaleCode =>
  routing.locales.includes(value as LocaleCode);
