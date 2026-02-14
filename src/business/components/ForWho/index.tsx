import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { creatorsPoints, designersPoints } from "../../constants/forWhoPoints";

async function ForWho() {
  const t = await getTranslations("ForWho");

  return (
    <section
      aria-labelledby="for-who-title"
      className="container flex flex-col gap-8 py-20 sm:py-24"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <h2
          id="for-who-title"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {t("title")}
        </h2>

        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/80 flex flex-col gap-4 p-6">
          <CardHeader className="gap-2 p-0">
            <CardTitle className="text-lg sm:text-xl">
              {t("designers.title")}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <ul className="flex flex-col gap-2">
              {designersPoints.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="text-primary size-5 shrink-0" aria-hidden />
                  <span className="text-sm sm:text-base">
                    {t(`designers.items.${point}`)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/80 flex flex-col gap-4 p-6">
          <CardHeader className="gap-2 p-0">
            <CardTitle className="text-lg sm:text-xl">
              {t("creators.title")}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <ul className="flex flex-col gap-2">
              {creatorsPoints.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="text-primary size-5 shrink-0" aria-hidden />
                  <span className="text-sm sm:text-base">
                    {t(`creators.items.${point}`)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default ForWho;
