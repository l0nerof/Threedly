import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Link } from "@/src/i18n/routing";
import { Download, Search, Upload } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import AuthCard from "../components/AuthCard";
import LoginForm from "../components/LoginForm";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reset?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { reset } = await searchParams;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Auth.login");
  const valueBulletsT = await getTranslations("Auth.valueBullets");

  return (
    <AuthCard
      title={t("title")}
      description={
        <>
          {t("description")}{" "}
          <Link
            href="/signup"
            className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors duration-300"
          >
            {t("link")}
          </Link>
        </>
      }
      valueBullets={[
        { icon: Search, label: valueBulletsT("catalog") },
        { icon: Download, label: valueBulletsT("formats") },
        {
          icon: Upload,
          label: valueBulletsT("publish"),
          isBeta: true,
          betaLabel: valueBulletsT("beta"),
        },
      ]}
    >
      <LoginForm
        successMessage={
          reset === "success" ? t("passwordResetSuccessMessage") : undefined
        }
      />
    </AuthCard>
  );
}
