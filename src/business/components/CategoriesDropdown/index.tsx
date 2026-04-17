"use client";

import { Link } from "@/src/i18n/routing";
import { cn } from "@/src/shared/utils/cn";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type CategoriesDropdownProps = {
  item: { name: string; dropdown: { label: string; href: string }[] };
  idx: number;
  hovered: number | null;
  setHovered: (idx: number | null) => void;
  onItemClick?: () => void;
};

export const CategoriesDropdown = ({
  item,
  idx,
  hovered,
  setHovered,
  onItemClick,
}: CategoriesDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Header");

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        setHovered(idx);
        setIsOpen(true);
      }}
      onMouseLeave={() => {
        setHovered(null);
        setIsOpen(false);
      }}
    >
      <button
        type="button"
        className="text-foreground relative flex cursor-default items-center gap-1 px-4 py-2"
      >
        <AnimatePresence>
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-muted absolute inset-0 h-full w-full rounded-full"
            />
          )}
        </AnimatePresence>
        <span className="relative z-20">{t(item.name)}</span>
        <ChevronDown
          className={cn(
            "relative z-20 size-4 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="bg-background border-border absolute top-full left-1/2 z-[70] mt-2 min-w-44 -translate-x-1/2 rounded-xl border p-1.5 shadow-lg"
          >
            {item.dropdown.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => {
                  setIsOpen(false);
                  onItemClick?.();
                }}
                className="text-foreground hover:bg-muted block rounded-lg px-3 py-2 text-sm transition-colors"
              >
                {child.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
