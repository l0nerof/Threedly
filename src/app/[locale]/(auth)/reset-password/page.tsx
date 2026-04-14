import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Link } from "@/src/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import AuthCard from "../components/AuthCard";
import ResetPasswordForm from "../components/ResetPasswordForm";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Auth.resetPassword");

  return (
    <AuthCard
      title={t("title")}
      description={
        <>
          {t("description")}{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors duration-300"
          >
            {t("backToLogin")}
          </Link>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
