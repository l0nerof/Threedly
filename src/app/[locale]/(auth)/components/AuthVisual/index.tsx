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
        <div className="flex w-full flex-col gap-6 text-center text-white">
          <Badge
            variant="secondary"
            className="rounded-full border border-white/12 bg-white/10 px-4 py-1.5 text-[0.72rem] tracking-[0.16em] text-white uppercase backdrop-blur-sm"
          >
            {t("eyebrow")}
          </Badge>

          <div className="flex flex-col gap-4">
            <h2 className="text-left text-4xl font-semibold tracking-tight text-balance xl:text-5xl">
              {t("title")}
            </h2>
            <p className="max-w-lg text-left text-base leading-7 text-white/78 xl:text-lg">
              {t("description")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {authVisualCards.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/7 p-4 backdrop-blur-sm"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-white/10">
                  <Icon className="size-4.5" aria-hidden />
                </div>
                <p className="text-[0.72rem] font-medium tracking-[0.14em] text-white/56 uppercase">
                  {t(`cards.${key}.label`)}
                </p>
                <p className="text-sm leading-6 text-white/84">
                  {t(`cards.${key}.value`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthVisual;
