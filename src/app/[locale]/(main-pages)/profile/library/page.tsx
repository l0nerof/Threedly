import { profileLibraryTabs } from "@/src/business/constants/profileConfig";
import { profileLibraryRequestSchema } from "@/src/business/schemas/profileLibrary";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Link } from "@/src/i18n/routing";
import { Badge } from "@/src/shared/components/Badge";
import { Button } from "@/src/shared/components/Button";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { fetchProfileLibraryData } from "./actions";
import ProfileLibraryTabs from "./components/ProfileLibraryTabs";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfileLibraryPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const query = await searchParams;
  const request = profileLibraryRequestSchema.parse(query);
  const [t, result] = await Promise.all([
    getTranslations({ locale, namespace: "Profile" }),
    fetchProfileLibraryData(query),
  ]);

  if (!result.ok && result.error === "unauthorized") {
    redirect(`/${locale}/login`);
  }

  const library = result.ok ? result.library : null;
  if (library && request.page !== library.current_page) {
    const normalized = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string") normalized.set(key, value);
      else if (Array.isArray(value))
        value.forEach((item) => normalized.append(key, item));
    }
    normalized.set("tab", library.active_tab);
    normalized.set("page", String(library.current_page));
    redirect(`/${locale}/profile/library?${normalized.toString()}`);
  }
  const counts = library
    ? {
        downloaded: library.downloaded_count,
        favoriteModels: library.favorite_count,
        subscriptions: library.followed_count,
      }
    : null;
  const numberFormat = new Intl.NumberFormat(
    locale === "ua" ? "uk-UA" : "en-US",
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="border-border/60 bg-surface/80 relative isolate overflow-hidden rounded-3xl border p-5 shadow-sm sm:p-7">
        <div
          aria-hidden
          className="from-primary/18 via-accent/18 absolute inset-0 bg-linear-to-br to-transparent"
        />
        <div
          aria-hidden
          className="bg-primary/10 absolute -top-20 right-10 size-56 rounded-full blur-3xl"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-3">
            <Badge
              variant="outline"
              className="bg-background/55 w-fit rounded-full px-3 py-1 backdrop-blur"
            >
              {t("library.badge")}
            </Badge>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("library.title")}
              </h1>
              <p className="text-muted-foreground text-sm leading-6 sm:text-base">
                {t("library.subtitle")}
              </p>
            </div>
          </div>

          {counts && (
            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-96">
              {profileLibraryTabs.map(({ value }) => (
                <div
                  key={value}
                  role="group"
                  aria-label={t(`library.stats.${value}`)}
                  className="border-border/60 bg-background/55 rounded-2xl border px-4 py-3 backdrop-blur"
                >
                  <p className="text-2xl font-semibold">
                    {numberFormat.format(counts[value])}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t(`library.stats.${value}`)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {library ? (
        <ProfileLibraryTabs
          key={library.profile_id}
          library={library}
          locale={locale}
        />
      ) : (
        <div
          role="alert"
          className="border-border/60 bg-surface/80 flex flex-col items-start gap-4 rounded-3xl border p-6"
        >
          <p>
            {t(
              !result.ok && result.error === "timeout"
                ? "library.loadTimeout"
                : "library.loadError",
            )}
          </p>
          <Button asChild>
            <Link
              href={`/profile/library?tab=${request.tab}&page=${request.page}`}
              prefetch={false}
            >
              {t("library.retry")}
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
