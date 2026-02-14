import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Link } from "@/src/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import AuthCard from "../components/AuthCard";
import VerifyEmailForm from "../components/VerifyEmailForm";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyEmailPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { email } = await searchParams;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Auth.verifyEmail");

  return (
    <AuthCard
      title={t("title")}
      description={
        <>
          {t("description")}{" "}
          <Link
            href="/signup"
            className="text-primary underline underline-offset-4"
          >
            {t("backToSignup")}
          </Link>
        </>
      }
    >
      <VerifyEmailForm initialEmail={email ?? ""} />
    </AuthCard>
  );
}
