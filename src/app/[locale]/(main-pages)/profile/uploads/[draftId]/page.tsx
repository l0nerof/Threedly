import PublicationEditor from "@/src/app/[locale]/(main-pages)/profile/uploads/components/PublicationEditor";
import { fetchPublicationDraftAction } from "@/src/app/[locale]/(main-pages)/profile/uploads/draft-actions";
import { fetchOwnedModelsPageAction } from "@/src/app/[locale]/(main-pages)/profile/uploads/management-actions";
import { publicationIdSchema } from "@/src/business/schemas/modelPublication";
import { mapCategoryGroupRowsToOptions } from "@/src/business/utils/categories";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

export default async function PublicationPage({
  params,
}: {
  params: Promise<{ locale: string; draftId: string }>;
}) {
  const { locale, draftId } = await params;
  const id = publicationIdSchema.safeParse(draftId);
  if (!isLocaleCode(locale) || !id.success) notFound();
  setRequestLocale(locale);
  const [result, account, t] = await Promise.all([
    fetchPublicationDraftAction({ draftId: id.data }),
    fetchOwnedModelsPageAction(),
    getTranslations({ locale, namespace: "Profile.uploads.editor" }),
  ]);
  if (
    (!result.ok && result.error === "unauthorized") ||
    (!account.ok && account.error === "unauthorized")
  )
    redirect(`/${locale}/login`);
  if (!result.ok && result.error === "draft_unavailable") notFound();
  if (!result.ok || !account.ok)
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">{t("editTitle")}</h1>
        <p role="alert">
          {t(!result.ok ? `errors.${result.error}` : "errors.generic")}
        </p>
        <Button variant="outline" asChild>
          <Link href={`/profile/uploads/${id.data}`}>{t("retry")}</Link>
        </Button>
        <Link
          href="/profile/uploads"
          className="underline focus-visible:outline-2"
        >
          {t("back")}
        </Link>
      </section>
    );
  if (result.data.draft.creator_id !== account.page.profileId) notFound();
  return (
    <PublicationEditor
      key={id.data}
      initial={result.data}
      ownerId={account.page.profileId}
      canUpload={account.page.canUpload}
      categoryGroups={
        account.page.categoryGroups
          ? mapCategoryGroupRowsToOptions(account.page.categoryGroups, locale)
          : null
      }
    />
  );
}
