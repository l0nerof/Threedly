"use client";

import ModelCard from "@/src/business/components/ModelCard";
import type { CatalogModel } from "@/src/business/types/catalog";

type CatalogModelCardProps = {
  model: CatalogModel;
  locale: string;
};

function CatalogModelCard({ model, locale }: CatalogModelCardProps) {
  return <ModelCard model={model} locale={locale} />;
}

export default CatalogModelCard;
