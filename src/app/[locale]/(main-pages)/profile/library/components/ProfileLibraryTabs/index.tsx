"use client";

import DesignerCard from "@/src/app/[locale]/(main-pages)/designers/components/DesignerCard";
import ModelCard from "@/src/business/components/ModelCard";
import ModelsPagination from "@/src/business/components/ModelsPagination";
import type { LocaleCode } from "@/src/business/constants/localization";
import { profileLibraryTabs } from "@/src/business/constants/profileConfig";
import type { CatalogModel } from "@/src/business/types/catalog";
import type { Designer } from "@/src/business/types/designer";
import type {
  ProfileLibraryPage,
  ProfileLibraryTab,
} from "@/src/business/types/profileLibrary";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/shared/components/Tabs";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type ProfileLibraryTabsProps = {
  library: ProfileLibraryPage;
  locale: LocaleCode;
};

type EmptyStateProps = {
  ctaHref: "/catalog" | "/designers";
  ctaLabel: string;
  description: string;
  title: string;
};

function EmptyState({
  ctaHref,
  ctaLabel,
  description,
  title,
}: EmptyStateProps) {
  return (
    <div className="border-border/60 bg-surface/80 flex flex-col items-start gap-4 rounded-3xl border p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          {description}
        </p>
      </div>
      <Button asChild>
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}

function ModelGrid({
  empty,
  locale,
  models,
}: {
  empty: EmptyStateProps;
  locale: LocaleCode;
  models: CatalogModel[];
}) {
  if (models.length === 0) {
    return <EmptyState {...empty} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {models.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          locale={locale}
          className="h-full"
          linkClassName="block h-full"
        />
      ))}
    </div>
  );
}

function DesignerGrid({
  designers,
  empty,
}: {
  designers: Designer[];
  empty: EmptyStateProps;
}) {
  if (designers.length === 0) {
    return <EmptyState {...empty} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {designers.map((designer) => (
        <DesignerCard key={designer.id} designer={designer} />
      ))}
    </div>
  );
}

function CountBadge({ count }: { count: string }) {
  return (
    <span className="bg-background/70 text-muted-foreground group-data-[state=active]/library-tab:text-foreground rounded-full px-2 py-0.5 text-xs transition-colors">
      {count}
    </span>
  );
}

function ProfileLibraryTabs({ library, locale }: ProfileLibraryTabsProps) {
  const t = useTranslations("Profile.library");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const tabCounts = {
    downloaded: library.downloaded_count,
    favoriteModels: library.favorite_count,
    subscriptions: library.followed_count,
  };
  const numberFormat = new Intl.NumberFormat(
    locale === "ua" ? "uk-UA" : "en-US",
  );
  function navigate(tab: ProfileLibraryTab, page: number) {
    if (
      isPending ||
      (tab === library.active_tab && page === library.current_page)
    )
      return;
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "downloaded") params.delete("tab");
    else params.set("tab", tab);
    if (page === 1) params.delete("page");
    else params.set("page", String(page));
    const query = params.toString();
    startTransition(() =>
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false }),
    );
  }

  return (
    <Tabs
      value={library.active_tab}
      onValueChange={(value) => {
        const tab = profileLibraryTabs.find((item) => item.value === value);
        if (tab) navigate(tab.value, 1);
      }}
      aria-busy={isPending}
      className="w-full gap-5"
    >
      <TabsList
        aria-label={t("title")}
        className="border-border/60 bg-surface/90 grid h-auto! w-full max-w-3xl grid-cols-1 gap-1.5 rounded-[1.65rem] border p-1.5 shadow-[0_12px_44px_hsl(var(--foreground)/0.08)] backdrop-blur-sm sm:grid-cols-3 sm:rounded-full"
      >
        {profileLibraryTabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              aria-label={`${t(`tabs.${tab.value}`)} ${numberFormat.format(tabCounts[tab.value])}`}
              disabled={isPending}
              className="group/library-tab data-[state=active]:from-primary/20 data-[state=active]:via-primary/14 data-[state=active]:to-primary/8 data-[state=active]:border-primary/25 h-11 min-w-0 rounded-full border border-transparent px-4 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_14px_34px_hsl(var(--primary)/0.18)]"
            >
              <Icon className="size-4" aria-hidden />
              <span className="truncate">{t(`tabs.${tab.value}`)}</span>
              <CountBadge count={numberFormat.format(tabCounts[tab.value])} />
            </TabsTrigger>
          );
        })}
      </TabsList>

      {isPending && (
        <p role="status" className="text-muted-foreground text-sm">
          {t("loading")}
        </p>
      )}
      {profileLibraryTabs.map(({ value }) => (
        <TabsContent key={value} value={value} className="space-y-5">
          {value === library.active_tab && (
            <>
              {value === "subscriptions" ? (
                <DesignerGrid
                  designers={library.designers}
                  empty={{
                    ctaHref: "/designers",
                    ctaLabel: t("designersCta"),
                    description: t("empty.subscriptions.description"),
                    title: t("empty.subscriptions.title"),
                  }}
                />
              ) : (
                <ModelGrid
                  models={library.models}
                  locale={locale}
                  empty={{
                    ctaHref: "/catalog",
                    ctaLabel: t("primaryCta"),
                    description: t(`empty.${value}.description`),
                    title: t(`empty.${value}.title`),
                  }}
                />
              )}
              <ModelsPagination
                currentPage={library.current_page}
                totalPages={library.total_pages}
                pageOfLabel={t("pagination.pageOf", {
                  current: library.current_page,
                  total: library.total_pages,
                })}
                previousPageLabel={t("pagination.previous")}
                nextPageLabel={t("pagination.next")}
                onPageChange={(page) => navigate(library.active_tab, page)}
              />
            </>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default ProfileLibraryTabs;
