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
import { Separator } from "@/src/shared/components/Separator";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { uploadModelAction } from "./actions";
import ModelUploadForm from "./components/ModelUploadForm";

type Props = {
  params: Promise<{ locale: string }>;
};

type CategoryRow = {
  id: string;
  name_ua: string;
  name_en: string;
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

export default async function ProfileUploadsPage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Profile");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const [
    { data: categories, error: categoriesError },
    { data: uploadedModels, error: uploadedModelsError },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name_ua, name_en")
      .order(locale === "ua" ? "name_ua" : "name_en", { ascending: true }),
    supabase
      .from("models")
      .select(
        "id, title_ua, title_en, status, file_format, file_size_bytes, created_at",
      )
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const uploadModelWithLocale = uploadModelAction.bind(null, locale);
  const hasLoadError = Boolean(categoriesError || uploadedModelsError);
  const categoryOptions = ((categories ?? []) as CategoryRow[]).map(
    (category) => ({
      id: category.id,
      label: locale === "ua" ? category.name_ua : category.name_en,
    }),
  );
  const modelRows = (uploadedModels ?? []) as UploadedModelRow[];

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("uploads.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("uploads.subtitle")}
          </p>
        </div>
      </div>
      <Separator />

      {hasLoadError && (
        <p role="alert" className="text-destructive text-sm">
          {t("uploads.loadError")}
        </p>
      )}

      <Card className="border-border/60 gap-4 rounded-2xl p-6 shadow-none">
        <ModelUploadForm
          categories={categoryOptions}
          onUploadAction={uploadModelWithLocale}
        />
      </Card>

      <Card className="border-border/60 gap-4 rounded-2xl p-6 shadow-none">
        <CardHeader className="p-0">
          <CardTitle>
            <h2>{t("uploads.list.title")}</h2>
          </CardTitle>
          <CardDescription>{t("uploads.list.description")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {modelRows.length > 0 ? (
            <div className="divide-border/60 divide-y">
              {modelRows.map((model) => {
                const title = locale === "ua" ? model.title_ua : model.title_en;

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
