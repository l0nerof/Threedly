import FeaturedCarousel from "@/src/business/components/FeaturedCarousel";
import { FEATURED_MODELS_MIN_COUNT } from "@/src/business/constants/catalogConfig";
import { fetchFeaturedModels } from "@/src/business/queries/featuredModels";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import { getTranslations } from "next-intl/server";

async function FeaturedModels() {
  const [models, t] = await Promise.all([
    fetchFeaturedModels(),
    getTranslations("FeaturedModels"),
  ]);

  if (models.length <= FEATURED_MODELS_MIN_COUNT) {
    return null;
  }

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,hsl(var(--primary)/0.12),transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 container mx-auto px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-primary text-xs font-medium tracking-[0.18em] uppercase">
              {t("eyebrow")}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/catalog">{t("viewAll")}</Link>
          </Button>
        </div>

        <FeaturedCarousel
          models={models}
          prevLabel={t("previousSlide")}
          nextLabel={t("nextSlide")}
          sectionLabel={t("title")}
        />
      </div>
    </section>
  );
}

export default FeaturedModels;
