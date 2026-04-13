import {
  featureKeysByPlan,
  planKeys,
  pricingPlanMeta,
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
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

async function PricingCards() {
  const t = await getTranslations("Pricing");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {planKeys.map((planKey) => {
        const featureKeys = featureKeysByPlan[planKey];
        const isPopular = planKey === "pro";
        const planMeta = pricingPlanMeta[planKey];
        const PlanIcon = planMeta.icon;

        return (
          <Card
            key={planKey}
            className={cn(
              "h-full rounded-4xl p-6 sm:p-7",
              planMeta.cardClassName,
            )}
          >
            <CardHeader className="flex flex-col items-start gap-4 p-0">
              <div className="flex w-full items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-2xl border",
                      planMeta.iconWrapClassName,
                    )}
                  >
                    <PlanIcon className="size-5" aria-hidden />
                  </div>

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

            <Separator className="my-6" />

            <CardContent className="flex flex-1 flex-col gap-4 p-0">
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

            <CardFooter className="p-0">
              <Button
                className="w-full rounded-full"
                variant={planMeta.buttonVariant}
              >
                {t("cta")}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

export default PricingCards;
