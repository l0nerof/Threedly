import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import ColorBends from "@/src/shared/components/ColorBends";
import TextType from "@/src/shared/components/TextType";
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
        className="via-background/50 to-background pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent"
      />
      <div className="relative z-10 container flex min-h-[80vh] flex-col items-center justify-center gap-6 py-16 text-center sm:py-20">
        <span className="bg-foreground/10 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
          {t("badge")}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          {t("title")}
        </h1>
        <TextType
          as="p"
          className="max-w-2xl text-base sm:text-lg"
          text={[t("type.one"), t("type.two"), t("type.three")]}
          typingSpeed={45}
          deletingSpeed={25}
          pauseDuration={1700}
          showCursor
        />
        <div className="flex items-center gap-2">
          <Button asChild size="lg">
            <Link href="/catalog">{t("primaryCta")}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="#how-it-works">{t("secondaryCta")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
