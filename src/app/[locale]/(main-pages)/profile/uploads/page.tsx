import ModelsPagination from "@/src/business/components/ModelsPagination";
import { UPLOADS_PAGE_SIZE } from "@/src/business/constants/profileConfig";
import type { CategoryGroupRow } from "@/src/business/types/category";
import { mapCategoryGroupRowsToOptions } from "@/src/business/utils/categories";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";
import { Badge } from "@/src/shared/components/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { uploadModelAction } from "./actions";
import ModelUploadForm from "./components/ModelUploadForm";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

type UploadedModelStatus = "draft" | "published" | "archived";

type UploadedModelRow = {
  id: string;
  title_ua: string;
  title_en: string;
  status: UploadedModelStatus;
  file_format: string | null;
  file_size_bytes: number | null;
  created_at: string;
};

function formatFileSize(size: number | null): string {
  if (!size) {
    return "0 MB";
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default async function ProfileUploadsPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (currentPage - 1) * UPLOADS_PAGE_SIZE;
  const to = from + UPLOADS_PAGE_SIZE - 1;

  const t = await getTranslations("Profile");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const [
    { data: categoryGroups, error: categoryGroupsError },
    { data: uploadedModels, error: uploadedModelsError, count },
  ] = await Promise.all([
    supabase
      .from("category_groups")
      .select(
        "id, slug, name_ua, name_en, sort_order, categories(id, slug, name_ua, name_en, sort_order, is_featured)",
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("models")
      .select(
        "id, title_ua, title_en, status, file_format, file_size_bytes, created_at",
        { count: "exact" },
      )
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to),
  ]);

  const uploadModelWithLocale = uploadModelAction.bind(null, locale);
  const hasLoadError = Boolean(categoryGroupsError || uploadedModelsError);
  const categoryOptions = mapCategoryGroupRowsToOptions(
    (categoryGroups ?? []) as CategoryGroupRow[],
    locale,
  );
  const modelRows = (uploadedModels ?? []) as UploadedModelRow[];
  const totalPages = Math.ceil((count ?? 0) / UPLOADS_PAGE_SIZE);
  const pageFrom = (currentPage - 1) * UPLOADS_PAGE_SIZE + 1;
  const pageTo = Math.min(currentPage * UPLOADS_PAGE_SIZE, count ?? 0);
  const pageOfLabel = t("uploads.list.pageOf", {
    from: pageFrom,
    to: pageTo,
    total: count ?? 0,
  });

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

      {hasLoadError && (
        <p role="alert" className="text-destructive text-sm">
          {t("uploads.loadError")}
        </p>
      )}

      <Card className="border-border/60 bg-surface/90 gap-0 overflow-hidden rounded-3xl p-0 shadow-sm">
        <ModelUploadForm
          categoryGroups={categoryOptions}
          onUploadAction={uploadModelWithLocale}
        />
      </Card>

      <Card className="border-border/60 bg-surface/80 gap-4 rounded-3xl p-6 shadow-sm">
        <CardHeader className="p-0">
          <CardTitle>
            <h2>{t("uploads.list.title")}</h2>
          </CardTitle>
          <CardDescription>{t("uploads.list.description")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {modelRows.length > 0 ? (
            <>
              <div className="divide-border/60 divide-y">
                {modelRows.map((model) => {
                  const title =
                    locale === "ua" ? model.title_ua : model.title_en;

                  return (
                    <article
                      key={model.id}
                      className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-col gap-1">
                        <h2 className="text-sm font-medium">{title}</h2>
                        <p className="text-muted-foreground text-xs">
                          {model.file_format?.toUpperCase() ??
                            t("uploads.list.unknownFormat")}
                          {" · "}
                          {formatFileSize(model.file_size_bytes)}
                        </p>
                      </div>
                      <Badge variant="outline" className="w-fit rounded-full">
                        {t(`uploads.status.${model.status}`)}
                      </Badge>
                    </article>
                  );
                })}
              </div>
              <ModelsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageOfLabel={pageOfLabel}
                previousPageLabel={t("uploads.list.previousPage")}
                nextPageLabel={t("uploads.list.nextPage")}
              />
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{t("uploads.empty.title")}</p>
              <p className="text-muted-foreground text-sm">
                {t("uploads.empty.description")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
