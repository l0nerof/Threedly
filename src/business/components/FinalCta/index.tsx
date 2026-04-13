"use client";

import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import LightRays from "@/src/shared/components/LightRays";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

function FinalCta() {
  const t = useTranslations("FinalCta");

  return (
    <section className="relative w-full overflow-hidden py-20 sm:py-28">
      <div aria-hidden className="absolute inset-0">
        <LightRays
          className="z-0 opacity-35 dark:hidden"
          raysOrigin="top-center"
          raysColor="#000000"
          raysSpeed={1.2}
          lightSpread={1.12}
          rayLength={2.1}
          fadeDistance={1.18}
          followMouse={false}
          mouseInfluence={0}
          noiseAmount={0.02}
          distortion={0.04}
        />
        <LightRays
          className="z-0 hidden opacity-45 dark:block"
          raysOrigin="top-center"
          raysSpeed={1.2}
          lightSpread={1.12}
          rayLength={2.1}
          fadeDistance={1.18}
          followMouse={false}
          mouseInfluence={0}
          noiseAmount={0.02}
          distortion={0.04}
        />
      </div>

      {/* background gradient */}
      <div
        aria-hidden
        className="from-background/95 via-background/70 pointer-events-none absolute inset-x-0 top-0 z-4 h-44 bg-linear-to-b to-transparent"
      />

      {/* container */}
      <div className="relative z-10 container">
        <motion.div
          className="border-border/60 bg-background/62 relative grid grid-cols-1 gap-8 overflow-hidden rounded-4xl border px-6 py-8 shadow-[0_28px_120px_hsl(var(--foreground)/0.12)] backdrop-blur-xl sm:px-8 sm:py-10 lg:grid-cols-2 lg:items-center lg:gap-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          {/* right top side gradient */}
          <div
            aria-hidden
            className="bg-primary/16 absolute -top-16 right-10 h-40 w-40 rounded-full blur-3xl"
          />

          {/* left side */}
          <div className="relative z-10 flex max-w-2xl flex-col gap-5">
            <span className="text-primary text-xs font-medium tracking-[0.2em] uppercase">
              {t("eyebrow")}
            </span>

            <div className="flex flex-col gap-4">
              <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
                {t("title")}
              </h2>
              <p className="text-muted-foreground max-w-xl text-base leading-7 sm:text-lg">
                {t("subtitle")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="group rounded-full px-6">
                <Link href="/catalog">
                  {t("primaryCta")}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-full px-6"
              >
                <Link href="/signup">{t("secondaryCta")}</Link>
              </Button>
            </div>
          </div>

          {/* right bottom side notes */}
          <div className="relative z-10 grid gap-3">
            {["one", "two", "three"].map((itemKey, index) => (
              <div
                key={itemKey}
                className="border-border/60 bg-card/68 flex items-start gap-4 rounded-2xl border p-4"
              >
                <span className="text-primary min-w-8 text-sm font-semibold tracking-[0.14em] uppercase">
                  0{index + 1}
                </span>
                <p className="text-foreground/84 text-sm leading-7 sm:text-base">
                  {t(`notes.${itemKey}`)}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default FinalCta;
