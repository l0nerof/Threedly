"use client";

import {
  FORMAT_BADGE_COLORS,
  PLAN_BADGE_COLORS,
} from "@/src/business/constants/catalogConfig";
import type { CatalogPlanKey } from "@/src/business/types/catalog";
import { cn } from "@/src/shared/utils/cn";
import { motion } from "motion/react";
import type { ReactNode } from "react";

type ModelCardShellProps = {
  title: string;
  plan: CatalogPlanKey;
  planLabel: string;
  media?: ReactNode;
  actions?: ReactNode;
  className?: string;
  eyebrow?: string;
  formatLabel?: string | null;
  interactive?: boolean;
  meta?: ReactNode;
  metaClassName?: string;
  mediaClassName?: string;
  showActionsDivider?: boolean;
  subtitle?: ReactNode;
  titleClassName?: string;
  titleHeadingLevel?: 1 | 2 | 3;
};

function ModelCardShell({
  title,
  plan,
  planLabel,
  media,
  actions,
  className,
  eyebrow,
  formatLabel,
  interactive = false,
  meta,
  metaClassName,
  mediaClassName,
  showActionsDivider = false,
  subtitle,
  titleClassName,
  titleHeadingLevel = 3,
}: ModelCardShellProps) {
  const normalizedFormatLabel = formatLabel?.toUpperCase();
  const TitleTag =
    titleHeadingLevel === 1 ? "h1" : titleHeadingLevel === 2 ? "h2" : "h3";

  return (
    <motion.article
      data-slot="model-card-shell"
      className={cn(
        "border-border/60 bg-surface-elevated/80 flex flex-col gap-4 rounded-[1.65rem] border p-4 shadow-xs sm:p-5",
        className,
      )}
      whileHover={interactive ? { y: -6 } : undefined}
      transition={
        interactive
          ? { type: "spring", stiffness: 300, damping: 20 }
          : undefined
      }
    >
      {media ? (
        <div
          className={cn(
            "bg-muted relative h-60 overflow-hidden rounded-[1.25rem]",
            mediaClassName,
          )}
        >
          {media}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase",
              PLAN_BADGE_COLORS[plan] ?? "text-muted-foreground bg-muted",
            )}
          >
            {planLabel}
          </span>
          {formatLabel ? (
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase",
                normalizedFormatLabel
                  ? FORMAT_BADGE_COLORS[normalizedFormatLabel]
                  : undefined,
                !normalizedFormatLabel ||
                  !FORMAT_BADGE_COLORS[normalizedFormatLabel]
                  ? "text-muted-foreground bg-muted"
                  : undefined,
              )}
            >
              {formatLabel}
            </span>
          ) : null}
        </div>

        {eyebrow ? (
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {eyebrow}
          </p>
        ) : null}

        <TitleTag
          className={cn(
            "line-clamp-2 text-base leading-snug font-semibold tracking-tight sm:text-lg",
            titleClassName,
          )}
        >
          {title}
        </TitleTag>

        {subtitle ? (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        ) : null}
        {meta ? (
          <div className={cn("text-muted-foreground text-sm", metaClassName)}>
            {meta}
          </div>
        ) : null}
      </div>

      {actions ? (
        <>
          {showActionsDivider ? (
            <div className="border-border/60 border-t" />
          ) : null}
          <div className="grid grid-cols-2 gap-2">{actions}</div>
        </>
      ) : null}
    </motion.article>
  );
}

export default ModelCardShell;
