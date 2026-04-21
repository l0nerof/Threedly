"use client";

import {
  audiencePanels,
  forWhoMetaKeys,
} from "@/src/business/constants/forWho";
import "@/src/business/constants/forWho";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/shared/components/Tabs";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { audiences } from "../../constants/audiences";
import { AudienceId } from "../../types/audience";

function ForWho() {
  const t = useTranslations("ForWho");
  const [activeTab, setActiveTab] = useState<AudienceId>("designers");

  return (
    <section
      id="for-who"
      aria-labelledby="for-who-title"
      className="relative py-20 sm:py-24"
    >
      <div className="container flex flex-col items-center gap-8">
        <motion.div
          className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="text-primary text-xs font-medium tracking-[0.18em] uppercase">
            {t("eyebrow")}
          </span>
          <h2
            id="for-who-title"
            className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl"
          >
            {t("title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl text-base leading-7 sm:text-lg">
            {t("subtitle")}
          </p>
        </motion.div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as AudienceId)}
          className="w-full items-center gap-6"
        >
          <TabsList className="border-border/60 bg-surface/90 h-auto! w-full max-w-xl rounded-full border p-1.5 shadow-[0_12px_44px_hsl(var(--foreground)/0.08)] backdrop-blur-sm">
            {audiences.map((audience) => {
              const AudienceIcon = audience.icon;

              return (
                <TabsTrigger
                  key={audience.id}
                  value={audience.id}
                  className="data-[state=active]:from-primary/20 data-[state=active]:via-primary/14 data-[state=active]:to-primary/8 data-[state=active]:border-primary/25 h-12 flex-1 rounded-full border border-transparent px-5 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_14px_34px_hsl(var(--primary)/0.18)] sm:text-base"
                >
                  <AudienceIcon aria-hidden />
                  {t(`${audience.id}.title`)}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {audiences.map((audience) => {
            const AudienceIcon = audience.icon;
            const pointKeys = audiencePanels[audience.id];

            return (
              <TabsContent
                key={audience.id}
                value={audience.id}
                className="w-full"
              >
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  className="border-border/60 bg-surface/90 relative w-full overflow-hidden rounded-[2rem] border p-6 backdrop-blur-sm sm:p-8"
                >
                  <div
                    aria-hidden
                    className={
                      audience.id === "designers"
                        ? "absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.22),transparent_42%),radial-gradient(circle_at_75%_20%,hsl(var(--foreground)/0.08),transparent_34%)] opacity-90"
                        : "absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.2),transparent_40%),radial-gradient(circle_at_20%_10%,hsl(var(--foreground)/0.08),transparent_30%)] opacity-90"
                    }
                  />

                  <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/12 text-primary border-primary/20 flex size-11 items-center justify-center rounded-2xl border">
                          <AudienceIcon className="size-5" aria-hidden />
                        </div>
                        <span className="text-primary text-xs font-medium tracking-[0.18em] uppercase">
                          {t(`${audience.id}.label`)}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h3 className="max-w-2xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                          {t(`${audience.id}.headline`)}
                        </h3>
                        <p className="text-muted-foreground max-w-2xl text-sm leading-7 sm:text-base">
                          {t(`${audience.id}.description`)}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {forWhoMetaKeys.map((itemKey) => (
                          <div
                            key={itemKey}
                            className="border-border/60 bg-surface-elevated/86 rounded-[1.5rem] border p-4 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.03)]"
                          >
                            <p className="text-muted-foreground text-[0.72rem] font-medium tracking-[0.14em] uppercase">
                              {t(`${audience.id}.meta.${itemKey}.label`)}
                            </p>
                            <p className="mt-3 text-sm leading-6 font-medium sm:text-base">
                              {t(`${audience.id}.meta.${itemKey}.value`)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="border-border/60 bg-surface/90 rounded-[1.6rem] border p-5">
                        <p className="text-foreground/84 text-sm leading-7 sm:text-base">
                          {t(`${audience.id}.note`)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {pointKeys.map((pointKey, index) => {
                        const PointIcon = audience.itemIcons[index];

                        return (
                          <div
                            key={pointKey}
                            className="border-border/60 bg-surface-elevated/84 flex items-start gap-4 rounded-[1.55rem] border px-4 py-4 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.03)] sm:px-5"
                          >
                            <div className="bg-primary/10 text-primary mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl">
                              <PointIcon className="size-4" aria-hidden />
                            </div>

                            <div className="space-y-1.5">
                              <p className="text-muted-foreground text-[0.72rem] font-medium tracking-[0.14em] uppercase">
                                {t("pointLabel", { number: index + 1 })}
                              </p>
                              <p className="text-foreground/86 text-sm leading-6 sm:text-base">
                                {t(`${audience.id}.items.${pointKey}`)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </section>
  );
}

export default ForWho;
