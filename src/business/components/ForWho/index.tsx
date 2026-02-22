"use client";

import { Tabs, TabsList, TabsTrigger } from "@/src/shared/components/Tabs";
import { Eye } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { audiences } from "../../constants/audiences";
import { creatorsPoints, designersPoints } from "../../constants/forWhoPoints";
import { AudienceId } from "../../types/audience";

const contentAnimation = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const cardsContainerAnimation = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardAnimation = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function isAudienceId(value: string): value is AudienceId {
  return audiences.some((audience) => audience.id === value);
}

function ForWho() {
  const t = useTranslations("ForWho");
  const [activeTab, setActiveTab] = useState<AudienceId>("designers");
  const activeAudience = audiences.find(
    (audience) => audience.id === activeTab,
  );
  const activePoints =
    activeTab === "designers" ? designersPoints : creatorsPoints;

  return (
    <section
      aria-labelledby="for-who-title"
      className="relative container flex flex-col items-center gap-8 overflow-hidden py-20 sm:py-24"
    >
      <motion.div
        className="flex flex-col items-center gap-3 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={contentAnimation}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2
          id="for-who-title"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {t("title")}
        </h2>

        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed sm:text-base">
          {t("subtitle")}
        </p>
      </motion.div>

      <motion.div
        className="flex justify-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={contentAnimation}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (isAudienceId(value)) {
              setActiveTab(value);
            }
          }}
        >
          <TabsList className="border-border/70 bg-muted/40 h-auto rounded-full border px-2 py-6">
            {audiences.map((audience) => (
              <TabsTrigger
                key={audience.id}
                value={audience.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-9 rounded-full px-4 py-2 text-sm sm:px-6"
              >
                <audience.icon className="size-4" />
                {t(`${audience.id}.title`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="container"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <motion.div
            className="grid gap-4 md:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={cardsContainerAnimation}
          >
            {activePoints.map((point, index) => {
              const FeatureIcon = activeAudience?.itemIcons[index] ?? Eye;

              return (
                <motion.article
                  key={point}
                  variants={cardAnimation}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="group border-border/70 bg-card/70 relative rounded-2xl border p-5 backdrop-blur-sm transition-colors sm:p-6"
                >
                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="bg-primary/12 text-primary border-primary/20 flex size-9 items-center justify-center rounded-lg border">
                      <FeatureIcon className="size-4.5" aria-hidden />
                    </div>

                    <p className="text-foreground/85 text-sm leading-relaxed sm:text-base">
                      {t(`${activeTab}.items.${point}`)}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export default ForWho;
