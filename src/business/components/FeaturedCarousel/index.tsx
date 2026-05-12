"use client";

import ModelCardShell from "@/src/business/components/ModelCardShell";
import type { CatalogModel } from "@/src/business/types/catalog";
import { Link } from "@/src/i18n/routing";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/src/shared/components/Carousel";
import Autoplay from "embla-carousel-autoplay";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

type CardProps = {
  model: CatalogModel;
};

function FeaturedModelCard({ model }: CardProps) {
  const t = useTranslations("FeaturedModels");
  const locale = useLocale();
  const title = locale === "ua" ? model.title_ua : model.title_en;

  return (
    <Link href={`/catalog/${model.slug}`} className="block h-full">
      <ModelCardShell
        title={title}
        plan={model.minimum_plan}
        planLabel={t(`modelCard.planBadge.${model.minimum_plan}`)}
        formatLabel={model.file_format}
        meta={t("modelCard.downloads", { count: model.download_count })}
        interactive
        className="h-full"
        media={
          <Image
            src={model.cover_image_path}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        }
      />
    </Link>
  );
}

type Props = {
  models: CatalogModel[];
  prevLabel: string;
  nextLabel: string;
  sectionLabel: string;
};

function FeaturedCarousel({
  models,
  prevLabel,
  nextLabel,
  sectionLabel,
}: Props) {
  return (
    <Carousel
      opts={{ align: "center", loop: true }}
      plugins={[
        Autoplay({
          delay: 5000,
          stopOnInteraction: false,
          stopOnMouseEnter: true,
        }),
      ]}
      className="w-full [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      aria-label={sectionLabel}
    >
      <CarouselContent className="-ml-4 py-3">
        {models.map((model) => (
          <CarouselItem
            key={model.id}
            className="basis-[85%] pl-4 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
          >
            <FeaturedModelCard model={model} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

export default FeaturedCarousel;
