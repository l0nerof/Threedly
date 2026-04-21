import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import ColorBends from "@/src/shared/components/ColorBends";
import TextType from "@/src/shared/components/TextType";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

async function Hero() {
  const t = await getTranslations("Hero");

  return (
    <section className="bg-background text-foreground relative w-full overflow-hidden">
      <div aria-hidden className="absolute inset-0">
        <ColorBends
          className="h-full w-full opacity-90"
          mouseInfluence={0}
          parallax={0}
        />
      </div>

      <div
        aria-hidden
        className="bg-background/55 absolute inset-x-[8%] top-1/2 h-96 -translate-y-1/2 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="bg-background/65 absolute inset-x-[18%] top-1/2 h-64 -translate-y-1/2 rounded-full blur-2xl"
      />
      <div
        aria-hidden
        className="via-background/55 to-background pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent"
      />

      <div className="relative z-10 container flex min-h-[80vh] flex-col items-center justify-center py-16 text-center sm:py-20">
        <div className="border-border/50 bg-surface/38 flex w-full max-w-4xl flex-col items-center gap-6 rounded-4xl border px-6 py-10 backdrop-blur-md sm:px-10 sm:py-12">
          <span className="bg-foreground/10 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
            {t("badge")}
          </span>

          <div className="flex flex-col items-center gap-4">
            <p className="text-primary text-xs font-medium tracking-[0.18em] uppercase">
              {t("eyebrow")}
            </p>

            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              {t("titleStart")}{" "}
              <span className="font-serif italic">{t("titleAccent")}</span>{" "}
              {t("titleEnd")}
            </h1>

            <p className="text-foreground/76 max-w-2xl text-base leading-7 sm:text-lg">
              {t("description")}
            </p>
          </div>

          <TextType
            as="p"
            className="text-foreground/72 max-w-2xl text-sm leading-7 sm:text-base"
            text={[t("type.one"), t("type.two"), t("type.three")]}
            typingSpeed={45}
            deletingSpeed={25}
            pauseDuration={1700}
            showCursor
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="group rounded-full px-6 transition-all duration-300 hover:scale-[1.01]"
            >
              <Link href="/catalog">
                {t("primaryCta")}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="rounded-full px-6 transition-all duration-300 hover:scale-[1.01]"
            >
              <Link href="#how-it-works">{t("secondaryCta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
