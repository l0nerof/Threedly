"use client";

import { DESIGNER_PLAN_BADGE } from "@/src/business/constants/designersConfig";
import type { Designer } from "@/src/business/types/designer";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import { cn } from "@/src/shared/utils/cn";
import { Grid2X2, Heart } from "lucide-react";
import { motion } from "motion/react";

type DesignerCardProps = {
  designer: Designer;
};

function DesignerCard({ designer }: DesignerCardProps) {
  const plan =
    DESIGNER_PLAN_BADGE[designer.plan_key] ?? DESIGNER_PLAN_BADGE.free;
  const initials = designer.username.slice(0, 2).toUpperCase();

  return (
    <Link href="#" className="block">
      <motion.article
        className="border-border/60 bg-surface-elevated/80 flex flex-col overflow-hidden rounded-[1.4rem] border"
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-muted text-muted-foreground relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                {designer.avatar_path ? (
                  <div
                    className="h-full w-full bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${designer.avatar_path})` }}
                  />
                ) : (
                  <span className="text-sm font-semibold">{initials}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">
                    @{designer.username}
                  </span>
                  {designer.is_verified && (
                    <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-orange-500">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path
                          d="M1.5 4L3.2 5.8L6.5 2.5"
                          stroke="white"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
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

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground shrink-0 rounded-full"
              onClick={(e) => e.preventDefault()}
              aria-label="Save designer"
            >
              <Heart className="size-4" />
            </Button>
          </div>

          {designer.bio && (
            <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
              {designer.bio}
            </p>
          )}

          {designer.specializations.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {designer.specializations.slice(0, 3).map((spec) => (
                <span
                  key={spec}
                  className="border-border/60 bg-surface text-muted-foreground rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize"
                >
                  {spec}
                </span>
              ))}
              {designer.specializations.length > 3 && (
                <span className="border-border/60 bg-surface text-muted-foreground rounded-full border px-2.5 py-0.5 text-[11px] font-medium">
                  +{designer.specializations.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Preview placeholder */}
        <div className="flex gap-0.5 px-4">
          <div className="bg-muted aspect-square flex-1 rounded-xl" />
          <div className="bg-muted aspect-square flex-1 rounded-xl" />
          <div className="bg-muted aspect-square flex-1 rounded-xl" />
        </div>

        {/* Footer */}
        <div className="border-border/40 flex border-t p-4">
          <Button
            type="button"
            className="h-10 w-full rounded-xl text-sm font-semibold"
            onClick={(e) => e.preventDefault()}
          >
            <Grid2X2 className="size-3.5" aria-hidden />
            Browse {designer.model_count} models
          </Button>
        </div>
      </motion.article>
    </Link>
  );
}

export default DesignerCard;
