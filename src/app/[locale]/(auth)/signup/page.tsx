import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Link } from "@/src/i18n/routing";
import { Download, Search, Upload } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import AuthCard from "../components/AuthCard";
import SignupForm from "../components/SignupForm";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SignupPage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Auth.signup");
  const valueBulletsT = await getTranslations("Auth.valueBullets");

  return (
    <AuthCard
      title={t("title")}
      description={
        <>
          {t("description")}{" "}
          <Link
            href="/login"
            className="text-primary underline underline-offset-4"
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
      <SignupForm />
    </AuthCard>
  );
}
