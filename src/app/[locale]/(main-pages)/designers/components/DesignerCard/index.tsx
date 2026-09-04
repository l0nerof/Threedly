"use client";

import FollowDesignerButton from "@/src/business/components/FollowDesignerButton";
import { DESIGNER_PLAN_BADGE } from "@/src/business/constants/designersConfig";
import type { Designer } from "@/src/business/types/designer";
import { Link, usePathname } from "@/src/i18n/routing";
import { cn } from "@/src/shared/utils/cn";
import { Grid2X2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";

type DesignerCardProps = {
  designer: Designer;
};

function DesignerCard({ designer }: DesignerCardProps) {
  const t = useTranslations("Designers.card");
  const pathname = usePathname();
  const plan =
    DESIGNER_PLAN_BADGE[designer.plan_key] ?? DESIGNER_PLAN_BADGE.free;
  const initials = designer.username.slice(0, 2).toUpperCase();
  const profileHref = `/designers/${designer.username}?from=${encodeURIComponent(pathname)}`;

  return (
    <Link
      href={profileHref}
      className="block min-w-0"
      aria-label={t("openProfile", { username: designer.username })}
    >
      <motion.article
        className="border-border/60 bg-surface-elevated/80 flex flex-col overflow-hidden rounded-[1.4rem] border"
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-muted text-muted-foreground relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                {designer.avatar_path ? (
                  <Image
                    src={designer.avatar_path}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                ) : (
                  <span className="text-sm font-semibold">{initials}</span>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">
                    @{designer.username}
                  </span>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center self-start rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                    plan.className,
                  )}
                >
                  {plan.label}
                </span>
              </div>
            </div>

            <FollowDesignerButton
              designerId={designer.id}
              className="shrink-0"
            />
          </div>

          {designer.bio && (
            <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
              {designer.bio}
            </p>
          )}
        </div>

        <div className="border-border/40 flex border-t p-4">
          <span className="bg-primary text-primary-foreground inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors">
            <Grid2X2 className="size-3.5" aria-hidden />
            {t("browseModels", { count: designer.model_count })}
          </span>
        </div>
      </motion.article>
    </Link>
  );
}

export default DesignerCard;
