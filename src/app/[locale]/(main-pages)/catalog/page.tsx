import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import CatalogShell from "./components/CatalogShell";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "Catalog" });

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const supabase = await createClient();

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("slug, name_ua, name_en")
    .order("created_at");

  const categories =
    categoriesData?.map((category) => ({
      value: category.slug,
      label: locale === "ua" ? category.name_ua : category.name_en,
    })) ?? [];

  const requestedCategory = resolvedSearchParams.category;
  const initialCategories =
    requestedCategory &&
    (categories.length === 0 ||
      categories.some((category) => category.value === requestedCategory))
      ? [requestedCategory]
      : [];

  return (
    <CatalogShell
      categories={categories}
      initialCategories={initialCategories}
    />
  );
}
