import { fetchModelBySlug } from "@/src/app/[locale]/(main-pages)/catalog/actions";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import FilesTab from "./components/FilesTab";
import ModelHero from "./components/ModelHero";
import ModelTabs from "./components/ModelTabs";
import OverviewTab from "./components/OverviewTab";
import RelatedModels from "./components/RelatedModels";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function ModelPage({ params }: Props) {
  const { locale, slug } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const model = await fetchModelBySlug(slug);

  if (!model) {
    notFound();
  }

  return (
    <section className="bg-background text-foreground w-full">
      <div className="container flex flex-col gap-16 pt-40 pb-20">
        <ModelHero model={model} locale={locale} />
        <ModelTabs
          overviewContent={<OverviewTab model={model} locale={locale} />}
          filesContent={<FilesTab />}
        />
        <RelatedModels currentSlug={slug} />
      </div>
    </section>
  );
}
