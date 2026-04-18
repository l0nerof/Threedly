"use client";

import { Link } from "@/src/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/components/DropdownMenu";
import { cn } from "@/src/shared/utils/cn";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

type NavDropdownProps = {
  label: string;
  items: { label: string; href: string }[];
  idx: number;
  hovered: number | null;
  setHovered: (idx: number | null) => void;
  onItemClick?: () => void;
};

export const NavDropdown = ({
  label,
  items,
  idx,
  hovered,
  setHovered,
  onItemClick,
}: NavDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setIsOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setIsOpen(false), 120);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger
        onMouseEnter={() => {
          setHovered(idx);
          openMenu();
        }}
        onMouseLeave={() => {
          setHovered(null);
          scheduleClose();
        }}
        className="text-foreground relative flex cursor-pointer items-center gap-1 px-4 py-2 outline-none"
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
        <span className="relative z-20">{label}</span>
        <ChevronDown
          className={cn(
            "relative z-20 size-4 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        sideOffset={0}
        className="overflow-visible border-0 bg-transparent p-0 pt-2 shadow-none"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="bg-popover text-popover-foreground min-w-44 rounded-xl border p-1.5 shadow-md">
          {items.map((child) => (
            <DropdownMenuItem key={child.href} asChild>
              <Link
                href={child.href}
                onClick={onItemClick}
                className="rounded-lg px-3 py-2 text-sm"
              >
                {child.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
