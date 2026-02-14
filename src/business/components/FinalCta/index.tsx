import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import LightRays from "@/src/shared/components/LightRays";
import { getTranslations } from "next-intl/server";

async function FinalCta() {
  const t = await getTranslations("FinalCta");

  return (
    <section className="relative w-full py-20 sm:py-24">
      <div aria-hidden className="absolute inset-0">
        <LightRays
          className="z-0 opacity-45 dark:hidden"
          raysOrigin="top-center"
          raysColor="#000000"
          raysSpeed={1.4}
          lightSpread={1.15}
          rayLength={2.25}
          fadeDistance={1.2}
          followMouse={false}
          mouseInfluence={0}
          noiseAmount={0.02}
          distortion={0.06}
        />
        <LightRays
          className="z-0 hidden opacity-60 dark:block"
          raysOrigin="top-center"
          raysSpeed={1.4}
          lightSpread={1.15}
          rayLength={2.25}
          fadeDistance={1.2}
          followMouse={false}
          mouseInfluence={0}
          noiseAmount={0.02}
          distortion={0.06}
        />
      </div>
      <div
        aria-hidden
        className="from-background/95 via-background/70 pointer-events-none absolute inset-x-0 top-0 z-4 h-44 bg-linear-to-b to-transparent"
      />
      <div
        aria-hidden
        className="bg-background/40 pointer-events-none absolute inset-x-0 top-0 z-4 h-14 blur-xl"
      />
      <div
        aria-hidden
        className="from-background/58 via-background/30 to-background/74 absolute inset-0 z-3 bg-linear-to-b"
      />

      <div className="relative z-10">
        <div className="container flex min-h-[280px] flex-col items-center justify-center gap-8 px-6 py-14 text-center sm:min-h-[340px] sm:px-10 sm:py-18">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/catalog">{t("primaryCta")}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup">{t("secondaryCta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCta;
