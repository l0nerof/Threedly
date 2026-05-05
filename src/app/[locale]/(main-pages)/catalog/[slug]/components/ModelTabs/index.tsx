"use client";

import { Button } from "@/src/shared/components/Button";
import { cn } from "@/src/shared/utils/cn";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

type Tab = "overview" | "filesAndFormats";

type ModelTabsProps = {
  overviewContent: ReactNode;
  filesContent: ReactNode;
};

function ModelTabs({ overviewContent, filesContent }: ModelTabsProps) {
  const t = useTranslations("ModelPage.tabs");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: t("overview") },
    { id: "filesAndFormats", label: t("filesAndFormats") },
  ];

  return (
    <div className="bg-surface-elevated flex flex-col rounded-2xl">
      <div className="border-border/60 flex border-b px-6">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "text-muted-foreground hover:text-foreground -mb-px rounded-none border-b-2 px-4 py-2.5 text-sm transition-colors hover:bg-transparent",
              activeTab === tab.id
                ? "border-b-primary text-foreground font-semibold"
                : "border-b-transparent font-medium",
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "overview" && overviewContent}
      {activeTab === "filesAndFormats" && filesContent}
    </div>
  );
}

export default ModelTabs;
