"use client";

import {
  featureKeysByPlan,
  planKeys,
  pricingPlanMeta,
  pricingPlanMotionMeta,
} from "@/src/business/constants/pricing";
import { Badge } from "@/src/shared/components/Badge";
import { Button } from "@/src/shared/components/Button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import { Separator } from "@/src/shared/components/Separator";
import { cn } from "@/src/shared/utils/cn";
import { ArrowUpRight, Check } from "lucide-react";
import { type Variants, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

const cardIntroVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
    scale: 0.98,
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.08,
      duration: 0.52,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

function PricingCards() {
  const t = useTranslations("Pricing");
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative grid gap-6 lg:grid-cols-3">
      {planKeys.map((planKey, index) => {
        const featureKeys = featureKeysByPlan[planKey];
        const isPopular = planKey === "pro";
        const planMeta = pricingPlanMeta[planKey];
        const motionMeta = pricingPlanMotionMeta[planKey];
        const PlanIcon = planMeta.icon;

        return (
          <motion.div
            key={planKey}
            className="relative z-10 h-full"
            custom={index}
            initial={shouldReduceMotion ? false : "hidden"}
            whileInView={shouldReduceMotion ? undefined : "visible"}
            viewport={{ once: true, amount: 0.35 }}
            variants={cardIntroVariants}
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    y: motionMeta.hoverY,
                    rotate: motionMeta.hoverRotate,
                    scale: motionMeta.hoverScale,
                  }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 280, damping: 22, mass: 0.75 }
            }
          >
            <Card
              className={cn(
                "relative isolate h-full overflow-hidden rounded-4xl p-6 transition-colors duration-300 sm:p-7",
                planMeta.cardClassName,
              )}
            >
              <div
                aria-hidden
                className="via-primary/35 absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
              />

              <CardHeader className="relative z-10 flex flex-col items-start gap-4 p-0">
                <div className="flex w-full items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-2xl border",
                        planMeta.iconWrapClassName,
                      )}
                      animate={
                        shouldReduceMotion
                          ? undefined
                          : {
                              y: [0, -4, 0],
                            }
                      }
                      transition={
                        shouldReduceMotion
                          ? undefined
                          : {
                              delay: motionMeta.floatDelay,
                              duration: 3.4,
                              ease: "easeInOut",
                              repeat: Infinity,
                            }
                      }
                    >
                      <PlanIcon className="size-5" aria-hidden />
                    </motion.div>

                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-xl sm:text-2xl">
                        {t(`plans.${planKey}.name`)}
                      </CardTitle>

                      <CardDescription className="text-sm leading-6">
                        {t(`plans.${planKey}.description`)}
                      </CardDescription>
                    </div>
                  </div>

                  {isPopular ? (
                    <CardAction>
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium"
                      >
                        {t("plans.pro.badge")}
                      </Badge>
                    </CardAction>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tracking-tight">
                      {t(`plans.${planKey}.price`)}
                    </span>
                    <span className="text-muted-foreground text-sm sm:text-base">
                      {t("billingPeriod")}
                    </span>
                  </div>

                  <p className="text-muted-foreground text-sm leading-6">
                    {t(`plans.${planKey}.summary`)}
                  </p>
                </div>
              </CardHeader>

              <Separator className="relative z-10 my-6" />

              <CardContent className="relative z-10 flex flex-1 flex-col gap-4 p-0">
                <p className="text-muted-foreground text-[0.72rem] font-medium tracking-[0.14em] uppercase">
                  {t("includesLabel")}
                </p>

                <ul className="flex flex-col gap-3 text-sm">
                  {featureKeys.map((featureKey) => (
                    <li key={featureKey} className="flex items-start gap-3">
                      <div className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full">
                        <Check className="size-4" aria-hidden />
                      </div>
                      <span className="leading-6">
                        {t(`plans.${planKey}.features.${featureKey}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="relative z-10 p-0">
                <Button
                  className="group w-full rounded-full"
                  variant={planMeta.buttonVariant}
                  type="button"
                >
                  {t("cta")}
                  <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

export default PricingCards;
