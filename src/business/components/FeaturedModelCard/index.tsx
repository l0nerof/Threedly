"use client";

import ModelCard from "@/src/business/components/ModelCard";
import type { CatalogModel } from "@/src/business/types/catalog";

type Props = {
  model: CatalogModel;
};

export default function FeaturedModelCard({ model }: Props) {
  return (
    <ModelCard
      model={model}
      className="h-full"
      linkClassName="block h-full"
      imageSizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
    />
  );
}
