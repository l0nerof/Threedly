"use client";

import FeaturedModelCard from "@/src/business/components/FeaturedModelCard";
import type { CatalogModel } from "@/src/business/types/catalog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/src/shared/components/Carousel";
import Autoplay from "embla-carousel-autoplay";

type Props = {
  models: CatalogModel[];
  prevLabel: string;
  nextLabel: string;
  sectionLabel: string;
};

function FeaturedCarousel({ models, sectionLabel }: Props) {
  return (
    <Carousel
      opts={{ align: "center", loop: true }}
      plugins={[
        Autoplay({
          delay: 2500,
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
