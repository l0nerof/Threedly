import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import CatalogShell from "./components/CatalogShell";
import {
  catalogFormatValues,
  catalogPlanKeys,
  catalogSortValues,
} from "./constants/catalogConfig";
import {
  type CatalogFilterOption,
  type CatalogShellContent,
  type CatalogSortOption,
} from "./types/catalog";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
};

type CatalogTranslations = Awaited<ReturnType<typeof getTranslations>>;

function resolveSearchParamValues(
  value: string | string[] | undefined,
): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

function buildCatalogContent(t: CatalogTranslations): CatalogShellContent {
  return {
    badge: t("badge"),
    title: t("title"),
    subtitle: t("subtitle"),
    searchLabel: t("searchLabel"),
    searchPlaceholder: t("searchPlaceholder"),
    mobileFiltersButton: t("mobileFiltersButton"),
    sortLabel: t("sortLabel"),
    resetFilters: t("resetFilters"),
    activeFiltersLabel: t("activeFiltersLabel"),
    noActiveFilters: t("noActiveFilters"),
    removeFilter: t("removeFilter"),
    filtersPanel: {
      title: t("filtersPanel.title"),
      description: t("filtersPanel.description"),
    },
    filters: {
      category: {
        title: t("filters.category.title"),
        description: t("filters.category.description"),
        empty: t("filters.category.empty"),
      },
      plan: {
        title: t("filters.plan.title"),
        description: t("filters.plan.description"),
      },
      format: {
        title: t("filters.format.title"),
        description: t("filters.format.description"),
      },
    },
    resultsArea: {
      ariaLabel: t("resultsArea.ariaLabel"),
      title: t("resultsArea.title"),
      description: t("resultsArea.description"),
      paginationLabel: t("resultsArea.paginationLabel"),
    },
  };
}

function buildPlanOptions(
  t: CatalogTranslations,
): CatalogFilterOption<(typeof catalogPlanKeys)[number]>[] {
  return catalogPlanKeys.map((planKey) => ({
    value: planKey,
    label: t(`filters.plan.options.${planKey}.label`),
    description: t(`filters.plan.options.${planKey}.description`),
  }));
}

function buildFormatOptions(
  t: CatalogTranslations,
): CatalogFilterOption<(typeof catalogFormatValues)[number]>[] {
  return catalogFormatValues.map((formatValue) => ({
    value: formatValue,
    label: t(`filters.format.options.${formatValue}.label`),
    description: t(`filters.format.options.${formatValue}.description`),
  }));
}

function buildSortOptions(t: CatalogTranslations): CatalogSortOption[] {
  return catalogSortValues.map((sortValue) => ({
    value: sortValue,
    label: t(`sortOptions.${sortValue}.label`),
    description: t(`sortOptions.${sortValue}.description`),
  }));
}

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

  const [t, supabase] = await Promise.all([
    getTranslations("Catalog"),
    createClient(),
  ]);

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("slug, name_ua, name_en")
    .order("created_at");

  const categories =
    categoriesData?.map((category) => ({
      value: category.slug,
      label: locale === "ua" ? category.name_ua : category.name_en,
    })) ?? [];

  const requestedCategories = resolveSearchParamValues(
    resolvedSearchParams.category,
  );
  const initialCategories =
    categories.length === 0
      ? requestedCategories
      : requestedCategories.filter((requestedCategory) =>
          categories.some((category) => category.value === requestedCategory),
        );

  return (
    <CatalogShell
      categories={categories}
      planOptions={buildPlanOptions(t)}
      formatOptions={buildFormatOptions(t)}
      sortOptions={buildSortOptions(t)}
      initialCategories={initialCategories}
      content={buildCatalogContent(t)}
    />
  );
}
