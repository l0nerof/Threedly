"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import { cn } from "@/src/shared/utils/cn";
import { CreditCard, Download, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { StepKey } from "../../types/howItWorksSteps";

function HowItWorks() {
  const t = useTranslations("HowItWorks");
  const [activeStep, setActiveStep] = useState(0);

  const steps = useMemo(
    () => [
      {
        key: "one" as StepKey,
        icon: UserPlus,
      },
      {
        key: "two" as StepKey,
        icon: CreditCard,
      },
      {
        key: "three" as StepKey,
        icon: Download,
      },
    ],
    [],
  );

  return (
    <motion.section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="container flex scroll-mt-24 flex-col items-center gap-10 py-20 sm:scroll-mt-28 sm:py-24"
    >
      <div className="flex flex-col items-center gap-3">
        <h2
          id="how-it-works-title"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {t("title")}
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          {t("subtitle")}
        </p>
      </div>

      <div className="relative w-full">
        <div className="bg-border absolute top-0 bottom-0 left-4 hidden w-px sm:block" />
        <motion.div
          aria-hidden
          className="from-primary/80 via-primary to-primary/30 absolute top-0 left-4 hidden w-px origin-top bg-linear-to-b shadow-[0_0_24px_hsl(var(--primary)/0.4)] sm:block"
          animate={{
            height: `${((activeStep + 1) / steps.length) * 100}%`,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
        />

        <ol className="flex w-full flex-col gap-6 sm:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index <= activeStep;

            return (
              <motion.li
                key={step.key}
                className="relative pl-0 sm:pl-14"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                onViewportEnter={() => setActiveStep(index)}
              >
                <div
                  className={cn(
                    "bg-background text-muted-foreground ring-border absolute top-8 -left-0.5 hidden h-9 w-9 items-center justify-center rounded-full ring-2 transition-colors sm:flex",
                    isActive &&
                      "text-primary ring-primary/60 shadow-[0_0_16px_hsl(var(--primary)/0.35)]",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </div>

                <Card
                  className={cn(
                    "border-border/80 flex flex-col gap-4 p-6 transition-all duration-300",
                    isActive && "border-primary/40 shadow-md",
                  )}
                >
                  <CardHeader className="flex flex-col gap-2 p-0">
                    <span className="text-muted-foreground text-xs">
                      {t(`steps.${step.key}.tag`)}
                    </span>
                    <CardTitle className="mt-1 text-lg sm:text-xl">
                      {t(`steps.${step.key}.title`)}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-0">
                    <CardDescription className="text-sm sm:text-base">
                      {t(`steps.${step.key}.description`)}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </motion.section>
  );
}

export default HowItWorks;
