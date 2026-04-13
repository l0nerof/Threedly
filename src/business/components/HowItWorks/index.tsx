"use client";

import {
  AUTO_PLAY_DELAY,
  howItWorksSteps,
} from "@/src/business/constants/howItWorks";
import { cn } from "@/src/shared/utils/cn";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

function HowItWorks() {
  const t = useTranslations("HowItWorks");
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeConfig = howItWorksSteps[activeStep];
  const ActiveIcon = activeConfig.icon;

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % howItWorksSteps.length);
    }, AUTO_PLAY_DELAY);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="relative overflow-hidden py-22 sm:py-28"
    >
      <div className="container grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
        <motion.div
          className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="space-y-4">
            <span className="text-primary text-xs font-medium tracking-[0.2em] uppercase">
              {t("eyebrow")}
            </span>
            <h2
              id="how-it-works-title"
              className="max-w-lg text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl"
            >
              {t("title")}
            </h2>
            <p className="text-muted-foreground max-w-xl text-base leading-7 sm:text-lg">
              {t("subtitle")}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeConfig.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="border-border/60 bg-card/65 relative overflow-hidden rounded-4xl border p-6 backdrop-blur-sm sm:p-7"
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.22),transparent_62%)]"
              />
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
                    {t(`steps.${activeConfig.key}.tag`)}
                  </span>
                  <div className="bg-primary/10 text-primary border-primary/15 flex size-11 items-center justify-center rounded-2xl border">
                    <ActiveIcon className="size-5" aria-hidden />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl leading-tight font-semibold text-balance sm:text-3xl">
                    {t(`steps.${activeConfig.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-7 sm:text-base">
                    {t(`steps.${activeConfig.key}.description`)}
                  </p>
                </div>

                <div className="border-border/50 bg-background/72 rounded-3xl border p-4">
                  <p className="text-foreground/82 text-sm leading-7 sm:text-base">
                    {t(`steps.${activeConfig.key}.caption`)}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <ol
          className="grid gap-4"
          onMouseLeave={() => setIsPaused(false)}
          onBlur={() => setIsPaused(false)}
        >
          {howItWorksSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeStep;

            return (
              <motion.li
                key={step.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
              >
                <button
                  type="button"
                  onClick={() => setActiveStep(index)}
                  onMouseEnter={() => {
                    setActiveStep(index);
                    setIsPaused(true);
                  }}
                  onFocus={() => {
                    setActiveStep(index);
                    setIsPaused(true);
                  }}
                  className={cn(
                    "border-border/60 bg-card/45 relative flex w-full items-start gap-4 overflow-hidden rounded-[1.8rem] border p-5 text-left transition-all duration-300 sm:gap-5 sm:p-6",
                    isActive &&
                      "border-primary/35 bg-primary/6 shadow-[0_24px_70px_hsl(var(--primary)/0.12)]",
                  )}
                  aria-pressed={isActive}
                >
                  <div
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 top-0 h-px bg-transparent transition-colors duration-300",
                      isActive && "bg-primary/50",
                    )}
                  />

                  <span className="text-muted-foreground/80 min-w-12 text-3xl leading-none font-semibold tracking-tight sm:min-w-16 sm:text-5xl">
                    0{index + 1}
                  </span>

                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-primary text-xs font-medium tracking-[0.16em] uppercase">
                          {t(`steps.${step.key}.tag`)}
                        </span>
                        <h3 className="text-lg leading-tight font-semibold sm:text-2xl">
                          {t(`steps.${step.key}.title`)}
                        </h3>
                      </div>

                      <div
                        className={cn(
                          "bg-background text-muted-foreground border-border/60 flex size-11 shrink-0 items-center justify-center rounded-2xl border transition-colors",
                          isActive &&
                            "bg-primary/10 text-primary border-primary/20",
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </div>
                    </div>

                    <p className="text-muted-foreground max-w-2xl text-sm leading-7 sm:text-base">
                      {t(`steps.${step.key}.description`)}
                    </p>

                    <div className="bg-border/60 mt-2 h-1.5 w-full overflow-hidden rounded-full">
                      {isActive ? (
                        <motion.div
                          key={step.key}
                          className="bg-primary h-full rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: isPaused ? 0.25 : AUTO_PLAY_DELAY / 1000,
                            ease: "linear",
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorks;
