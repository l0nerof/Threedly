"use client";

import { authVisualCards } from "@/src/business/constants/auth";
import { Badge } from "@/src/shared/components/Badge";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const AuthVisualBackground = dynamic(() => import("../AuthVisualBackground"), {
  ssr: false,
});

function AuthVisual() {
  const t = useTranslations("Auth.visual");

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0">
        <AuthVisualBackground />
      </div>
      <div className="absolute inset-0 bg-linear-to-br from-black/35 via-black/10 to-black/60" />
      <div className="absolute inset-0 flex items-center justify-center p-8 xl:p-12">
        <div className="relative isolate w-full rounded-3xl border border-white/15 bg-black/45 p-6 text-center text-white shadow-2xl ring-1 shadow-black/30 ring-white/10 backdrop-blur-md xl:p-8">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-3xl bg-linear-to-br from-white/10 via-transparent to-black/25"
          />
          <div className="flex flex-col gap-6">
            <Badge
              variant="secondary"
              className="w-fit rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-[0.72rem] tracking-[0.16em] text-white uppercase shadow-sm backdrop-blur-sm"
            >
              {t("eyebrow")}
            </Badge>

            <div className="flex flex-col gap-4">
              <h2 className="text-left text-4xl font-semibold tracking-tight text-balance drop-shadow-sm xl:text-5xl">
                {t("title")}
              </h2>
              <p className="max-w-lg text-left text-base leading-7 text-white/85 xl:text-lg">
                {t("description")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {authVisualCards.map(({ icon: Icon, key }) => (
                <div
                  key={key}
                  className="flex flex-col gap-2 rounded-3xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-white/15">
                    <Icon className="size-4.5" aria-hidden />
                  </div>
                  <p className="text-[0.72rem] font-medium tracking-[0.14em] text-white/70 uppercase">
                    {t(`cards.${key}.label`)}
                  </p>
                  <p className="text-sm leading-6 text-white/90">
                    {t(`cards.${key}.value`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthVisual;
