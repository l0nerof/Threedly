import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";
import { LocaleCode } from "../business/constants/localization";

const supportedLocales: LocaleCode[] = [
  LocaleCode.Ukrainian,
  LocaleCode.English,
];

const defaultLocale: LocaleCode = LocaleCode.Ukrainian;

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: supportedLocales,

  // Used when no locale matches
  defaultLocale: defaultLocale,
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
