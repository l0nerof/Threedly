import CatalogModelCard from "@/src/app/[locale]/(main-pages)/catalog/components/CatalogModelCard";
import { DESIGNER_PLAN_BADGE } from "@/src/business/constants/designersConfig";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import { cn } from "@/src/shared/utils/cn";
import { ArrowLeft, Layers3 } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchDesignerProfileByUsername } from "../actions";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;

  if (!isLocaleCode(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "Designers.profile" });

  return {
    title: t("metadata.title", { username }),
    description: t("metadata.description", { username }),
  };
}

export default async function DesignerPage({ params }: Props) {
  const { locale, username } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Designers.profile");
  const profile = await fetchDesignerProfileByUsername(username);

  if (!profile) {
    return (
      <section className="bg-background text-foreground w-full">
        <div className="container flex min-h-[70vh] flex-col justify-center gap-8 py-32">
          <Button asChild variant="ghost" className="self-start rounded-full">
            <Link href="/designers">
              <ArrowLeft className="size-4" aria-hidden />
              {t("backToDesigners")}
            </Link>
          </Button>

          <div className="bg-surface/90 border-border/60 flex max-w-3xl flex-col gap-5 rounded-[2rem] border p-6 shadow-[0_28px_100px_hsl(var(--foreground)/0.08)] sm:p-8">
            <p className="text-muted-foreground text-sm font-medium">
              @{username}
            </p>
            <h1 className="text-3xl leading-tight font-semibold tracking-tight [overflow-wrap:anywhere] break-words sm:text-5xl">
              {t("notFound.title", { username })}
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-7">
              {t("notFound.description")}
            </p>
            <Button asChild className="self-start rounded-xl">
              <Link href="/designers">{t("notFound.cta")}</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const { designer, models } = profile;
  const plan =
    DESIGNER_PLAN_BADGE[designer.plan_key] ?? DESIGNER_PLAN_BADGE.free;
  const initials = designer.username.slice(0, 2).toUpperCase();

  return (
    <section className="bg-background text-foreground w-full overflow-hidden">
      <div className="container flex flex-col gap-8 pt-28 pb-14 sm:gap-10 sm:pt-32 sm:pb-20">
        <Button asChild variant="ghost" className="self-start rounded-full">
          <Link href="/designers">
            <ArrowLeft className="size-4" aria-hidden />
            {t("backToDesigners")}
          </Link>
        </Button>

        <section
          aria-labelledby="designer-profile-title"
          className="border-border/60 bg-surface/90 grid gap-6 overflow-hidden rounded-[2rem] border p-5 shadow-[0_28px_100px_hsl(var(--foreground)/0.08)] sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]"
        >
          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div className="bg-muted text-muted-foreground border-border/60 relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border sm:size-28">
                {designer.avatar_path ? (
                  <Image
                    src={designer.avatar_path}
                    alt={t("avatarAlt", {
                      username: designer.username,
                    })}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 96px, 112px"
                  />
                ) : (
                  <span className="text-3xl font-semibold">{initials}</span>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase",
                      plan.className,
                    )}
                  >
                    {plan.label}
                  </span>
                  <span className="border-border/60 text-muted-foreground inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                    {t("hero.modelsCount", {
                      count: designer.model_count,
                    })}
                  </span>
                </div>

                <h1
                  id="designer-profile-title"
                  className="max-w-full text-4xl leading-tight font-semibold tracking-tight [overflow-wrap:anywhere] break-words sm:text-5xl lg:text-6xl"
                >
                  {t("hero.title", { username: designer.username })}
                </h1>
              </div>
            </div>

            <p className="text-muted-foreground max-w-3xl text-base leading-7">
              {designer.bio ?? t("hero.emptyBio")}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-xl">
                <Link href="#designer-models">
                  <Layers3 className="size-4" aria-hidden />
                  {t("hero.primaryCta")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/catalog">{t("hero.secondaryCta")}</Link>
              </Button>
            </div>
          </div>

          <aside className="border-border/60 bg-surface-elevated/75 flex flex-col justify-between gap-6 rounded-[1.5rem] border p-5">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-tight">
                {t("panel.title")}
              </h2>
              <p className="text-muted-foreground text-sm leading-6">
                {models.length > 0
                  ? t("panel.withModels")
                  : t("panel.withoutModels")}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <div className="border-border/60 bg-surface/70 rounded-2xl border p-4">
                <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t("panel.plan")}
                </dt>
                <dd className="mt-2 text-lg font-semibold">{plan.label}</dd>
              </div>
              <div className="border-border/60 bg-surface/70 rounded-2xl border p-4">
                <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t("panel.models")}
                </dt>
                <dd className="mt-2 text-lg font-semibold">
                  {designer.model_count}
                </dd>
              </div>
            </dl>
          </aside>
        </section>

        <section
          id="designer-models"
          aria-labelledby="designer-models-title"
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex max-w-3xl flex-col gap-2">
              <h2
                id="designer-models-title"
                className="text-2xl font-semibold tracking-tight sm:text-3xl"
              >
                {t("models.title")}
              </h2>
              <p className="text-muted-foreground text-base leading-7">
                {t("models.description")}
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/catalog">{t("models.viewCatalog")}</Link>
            </Button>
          </div>

          {models.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {models.map((model) => (
                <CatalogModelCard
                  key={model.id}
                  model={model}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="border-border/60 bg-surface/80 grid gap-4 rounded-[1.5rem] border p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">
                  {t("models.emptyTitle")}
                </h3>
                <p className="text-muted-foreground max-w-2xl text-sm leading-6">
                  {t("models.emptyDescription")}
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/designers">{t("models.emptyCta")}</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
