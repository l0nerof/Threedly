"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/shared/components/Tabs";
import { useTranslations } from "next-intl";
import { type ReactNode } from "react";

type ModelTabsProps = {
  overviewContent: ReactNode;
  filesContent: ReactNode;
};

function ModelTabs({ overviewContent, filesContent }: ModelTabsProps) {
  const t = useTranslations("ModelPage.tabs");

  return (
    <div className="bg-surface-elevated flex flex-col rounded-2xl">
      <Tabs defaultValue="overview">
        <div className="border-border/60 border-b px-6">
          <TabsList variant="line" className="gap-0">
            <TabsTrigger value="overview" className="after:bg-primary">
              {t("overview")}
            </TabsTrigger>
            <TabsTrigger value="filesAndFormats" className="after:bg-primary">
              {t("filesAndFormats")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">{overviewContent}</TabsContent>
        <TabsContent value="filesAndFormats">{filesContent}</TabsContent>
      </Tabs>
    </div>
  );
}

export default ModelTabs;
