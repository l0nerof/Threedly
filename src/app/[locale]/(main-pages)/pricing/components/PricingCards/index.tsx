import { featureKeysByPlan, planKeys } from "@/src/business/constants/pricing";
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

        return (
          <Card
            key={planKey}
            className={cn(
              "h-full p-6",
              isPopular && "border-primary/50 shadow-lg",
            )}
          >
            <CardHeader className="flex flex-col items-start gap-4 p-0">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl">
                  {t(`plans.${planKey}.name`)}
                </CardTitle>

                <CardDescription>
                  {t(`plans.${planKey}.description`)}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {isPopular && (
                  <CardAction className="self-center">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {t("plans.pro.badge")}
                    </Badge>
                  </CardAction>
                )}

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold">
                    {t(`plans.${planKey}.price`)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {t("billingPeriod")}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4 p-0">
              <p className="text-muted-foreground text-sm">
                {t("includesLabel")}
              </p>

              <ul className="flex flex-col gap-3 text-sm">
                {featureKeys.map((featureKey) => (
                  <li key={featureKey} className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500" />
                    <span>{t(`plans.${planKey}.features.${featureKey}`)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="p-0">
              <Button className="w-full" variant="default">
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
