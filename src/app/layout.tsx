import { ThemeProvider } from "@/business/providers/ThemeProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Threedly - 3D моделі для дизайнерів",
  description: "Знайдіть найкращі 3D моделі для ваших проектів",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="wrapper">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
