import PublicationEditor from "@/src/app/[locale]/(main-pages)/profile/uploads/components/PublicationEditor";
import { fetchOwnedModelsPageAction } from "@/src/app/[locale]/(main-pages)/profile/uploads/management-actions";
import { mapCategoryGroupRowsToOptions } from "@/src/business/utils/categories";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

export default async function NewPublicationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocaleCode(locale)) notFound();
  setRequestLocale(locale);
  const [result, t] = await Promise.all([
    fetchOwnedModelsPageAction(),
    getTranslations({ locale, namespace: "Profile.uploads.editor" }),
  ]);
  if (!result.ok && result.error === "unauthorized")
    redirect(`/${locale}/login`);
  if (!result.ok || !result.page.canUpload)
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">{t("newTitle")}</h1>
        <p role="alert">
          {t(
            result.ok
              ? "noUploadAccess"
              : result.error === "timeout"
                ? "errors.timeout"
                : "errors.generic",
          )}
        </p>
        <Button variant="outline" asChild>
          <Link href="/profile/uploads/new">{t("retry")}</Link>
        </Button>
        <Link
          href="/profile/uploads"
          className="underline focus-visible:outline-2"
        >
          {t("back")}
        </Link>
      </section>
    );
  return (
    <PublicationEditor
      initial={null}
      ownerId={result.page.profileId}
      canUpload={result.page.canUpload}
      categoryGroups={
        result.page.categoryGroups
          ? mapCategoryGroupRowsToOptions(result.page.categoryGroups, locale)
          : null
      }
    />
  );
}
