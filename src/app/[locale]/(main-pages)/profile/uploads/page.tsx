import { ownedModelsRequestSchema } from "@/src/business/schemas/modelManagement";
import { mapCategoryGroupRowsToOptions } from "@/src/business/utils/categories";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { publicationPageNumber } from "@/src/business/utils/modelPublicationEditor";
import { Link } from "@/src/i18n/routing";
import { Badge } from "@/src/shared/components/Badge";
import { Button } from "@/src/shared/components/Button";
import { Card } from "@/src/shared/components/Card";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import PublicationDrafts from "./components/PublicationDrafts";
import UploadedModelsList from "./components/UploadedModelsList";
import { fetchPublicationDraftsPageAction } from "./draft-actions";
import { fetchOwnedModelsPageAction } from "./management-actions";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfileUploadsPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const query = await searchParams;
  const request = ownedModelsRequestSchema.parse({ page: query.page });
  const draftPage = publicationPageNumber(query.draftPage);
  const [t, result, draftResult] = await Promise.all([
    getTranslations({ locale, namespace: "Profile" }),
    fetchOwnedModelsPageAction({ page: query.page }),
    fetchPublicationDraftsPageAction({ page: draftPage }),
  ]);
  if (
    (!result.ok && result.error === "unauthorized") ||
    (!draftResult.ok && draftResult.error === "unauthorized")
  )
    redirect(`/${locale}/login`);
  if (
    (result.ok && request.page !== result.page.currentPage) ||
    (draftResult.ok && draftPage !== draftResult.data.currentPage)
  ) {
    const normalized = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string") normalized.set(key, value);
      else if (Array.isArray(value))
        value.forEach((item) => normalized.append(key, item));
    }
    if (result.ok) normalized.set("page", String(result.page.currentPage));
    if (draftResult.ok && draftPage !== draftResult.data.currentPage)
      normalized.set("draftPage", String(draftResult.data.currentPage));
    redirect(`/${locale}/profile/uploads?${normalized.toString()}`);
  }
  const drafts =
    draftResult.ok &&
    result.ok &&
    draftResult.data.drafts.some(
      (draft) => draft.creator_id !== result.page.profileId,
    )
      ? { ok: false as const, error: "session_changed" as const }
      : draftResult;
  const categoryOptions =
    result.ok && result.page.categoryGroups
      ? mapCategoryGroupRowsToOptions(result.page.categoryGroups, locale)
      : null;

  return (
    <section className="flex flex-col gap-6">
      <div className="border-border/60 bg-surface/80 relative isolate overflow-hidden rounded-3xl border p-5 shadow-sm sm:p-7">
        <div
          aria-hidden
          className="from-primary/18 via-accent/18 absolute inset-0 bg-linear-to-br to-transparent"
        />
        <div
          aria-hidden
          className="bg-primary/10 absolute -top-20 right-10 size-56 rounded-full blur-3xl"
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <Badge
              variant="outline"
              className="bg-background/55 w-fit rounded-full px-3 py-1 backdrop-blur"
            >
              {t("uploads.form.studioBadge")}
            </Badge>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("uploads.title")}
              </h1>
              <p className="text-muted-foreground text-sm leading-6 sm:text-base">
                {t("uploads.subtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!result.ok ? (
        <Card className="rounded-3xl p-6">
          <p role="alert" className="text-destructive text-sm">
            {t(
              result.error === "timeout"
                ? "uploads.management.errors.timeout"
                : "uploads.loadError",
            )}
          </p>
          <Button variant="outline" asChild>
            <Link href="/profile/uploads" locale={locale}>
              {t("uploads.management.retry")}
            </Link>
          </Button>
        </Card>
      ) : (
        <>
          <PublicationDrafts
            ownerId={result.page.profileId}
            canUpload={result.page.canUpload}
            result={drafts}
          />
          {!categoryOptions && (
            <div role="alert" className="text-destructive text-sm">
              <p>{t("uploads.management.categoriesUnavailable")}</p>
              <Link
                href="/profile/uploads"
                locale={locale}
                className="underline focus-visible:outline-2"
              >
                {t("uploads.management.retry")}
              </Link>
            </div>
          )}
          <UploadedModelsList
            key={result.page.profileId}
            page={{
              profileId: result.page.profileId,
              models: result.page.models,
              canUpload: result.page.canUpload,
              currentPage: result.page.currentPage,
              totalPages: result.page.totalPages,
              totalCount: result.page.totalCount,
            }}
            categoryGroups={categoryOptions}
          />
        </>
      )}
    </section>
  );
}
