"use client";

import DesignerCard from "@/src/app/[locale]/(main-pages)/designers/components/DesignerCard";
import ModelCard from "@/src/business/components/ModelCard";
import type { LocaleCode } from "@/src/business/constants/localization";
import type { CatalogModel } from "@/src/business/types/catalog";
import type { Designer } from "@/src/business/types/designer";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/shared/components/Tabs";
import { Download, Heart, UserRoundPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type ProfileLibraryTabsProps = {
  downloadedModels: CatalogModel[];
  favoriteModels: CatalogModel[];
  followedDesigners: Designer[];
  locale: LocaleCode;
};

type LibraryTabValue = "downloaded" | "favoriteModels" | "subscriptions";

const libraryTabs = [
  {
    icon: Download,
    translationKey: "downloaded",
    value: "downloaded",
  },
  {
    icon: Heart,
    translationKey: "favoriteModels",
    value: "favoriteModels",
  },
  {
    icon: UserRoundPlus,
    translationKey: "subscriptions",
    value: "subscriptions",
  },
] satisfies {
  icon: typeof Download;
  translationKey: LibraryTabValue;
  value: LibraryTabValue;
}[];

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

function CountBadge({ count }: { count: number }) {
  return (
    <span className="bg-background/70 text-muted-foreground group-data-[state=active]/library-tab:text-foreground rounded-full px-2 py-0.5 text-xs transition-colors">
      {count}
    </span>
  );
}

function ProfileLibraryTabs({
  downloadedModels,
  favoriteModels,
  followedDesigners,
  locale,
}: ProfileLibraryTabsProps) {
  const t = useTranslations("Profile.library");
  const [activeTab, setActiveTab] = useState<LibraryTabValue>("downloaded");
  const tabCounts: Record<LibraryTabValue, number> = {
    downloaded: downloadedModels.length,
    favoriteModels: favoriteModels.length,
    subscriptions: followedDesigners.length,
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as LibraryTabValue)}
      className="w-full gap-5"
    >
      <TabsList className="border-border/60 bg-surface/90 grid h-auto! w-full max-w-3xl grid-cols-1 gap-1.5 rounded-[1.65rem] border p-1.5 shadow-[0_12px_44px_hsl(var(--foreground)/0.08)] backdrop-blur-sm sm:grid-cols-3 sm:rounded-full">
        {libraryTabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="group/library-tab data-[state=active]:from-primary/20 data-[state=active]:via-primary/14 data-[state=active]:to-primary/8 data-[state=active]:border-primary/25 h-11 min-w-0 rounded-full border border-transparent px-4 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_14px_34px_hsl(var(--primary)/0.18)]"
            >
              <Icon className="size-4" aria-hidden />
              <span className="truncate">
                {t(`tabs.${tab.translationKey}`)}
              </span>
              <CountBadge count={tabCounts[tab.value]} />
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="downloaded">
        <ModelGrid
          models={downloadedModels}
          locale={locale}
          empty={{
            ctaHref: "/catalog",
            ctaLabel: t("primaryCta"),
            description: t("empty.downloaded.description"),
            title: t("empty.downloaded.title"),
          }}
        />
      </TabsContent>
      <TabsContent value="favoriteModels">
        <ModelGrid
          models={favoriteModels}
          locale={locale}
          empty={{
            ctaHref: "/catalog",
            ctaLabel: t("primaryCta"),
            description: t("empty.favoriteModels.description"),
            title: t("empty.favoriteModels.title"),
          }}
        />
      </TabsContent>
      <TabsContent value="subscriptions">
        <DesignerGrid
          designers={followedDesigners}
          empty={{
            ctaHref: "/designers",
            ctaLabel: t("designersCta"),
            description: t("empty.subscriptions.description"),
            title: t("empty.subscriptions.title"),
          }}
        />
      </TabsContent>
    </Tabs>
  );
}

export default ProfileLibraryTabs;
