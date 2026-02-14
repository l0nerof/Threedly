import { LocaleCode } from "@/src/business/constants/localization";
import { ThemeProvider } from "@/src/business/providers/ThemeProvider";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { routing } from "@/src/i18n/routing";
import { Toaster } from "@/src/shared/components/Sonner";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

const metadataByLocale: Record<LocaleCode, Metadata> = {
  [LocaleCode.Ukrainian]: {
    title: "Threedly - 3D моделі для дизайнерів",
    description: "Знайдіть найкращі 3D моделі для ваших проектів",
  },
  [LocaleCode.English]: {
    title: "Threedly - 3D models for designers",
    description: "Find the best 3D models for your projects",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocaleCode(locale)) {
    return metadataByLocale[routing.defaultLocale];
  }
  return metadataByLocale[locale];
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  // Ensure that the incoming `locale` is valid
  if (!isLocaleCode(locale)) {
    notFound();
  }
  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} relative w-full antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
