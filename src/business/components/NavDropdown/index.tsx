"use client";

import { Link } from "@/src/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/shared/components/DropdownMenu";
import { cn } from "@/src/shared/utils/cn";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type {
  NavDropdownGroupConfig,
  NavDropdownItemConfig,
} from "../../types/navItemsConfig";

type NavDropdownProps = {
  label: string;
  items?: NavDropdownItemConfig[];
  groups?: NavDropdownGroupConfig[];
  footerItem?: NavDropdownItemConfig;
  idx: number;
  hovered: number | null;
  setHovered: (idx: number | null) => void;
  onItemClick?: () => void;
};

export const NavDropdown = ({
  label,
  items,
  groups,
  footerItem,
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
              className="bg-surface-muted ring-border/70 dark:bg-surface-elevated dark:ring-primary/35 absolute inset-0 h-full w-full rounded-full ring-1"
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
          {groups && groups.length > 0 ? (
            <>
              <div className="grid max-w-[min(52rem,calc(100vw-2rem))] min-w-[42rem] grid-cols-3 gap-1">
                {groups.map((group) => (
                  <DropdownMenuGroup key={group.href} className="p-1">
                    <DropdownMenuItem asChild>
                      <Link
                        href={group.href}
                        onClick={onItemClick}
                        className="rounded-lg px-3 py-2 text-sm font-semibold"
                      >
                        {group.label}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuLabel className="sr-only">
                      {group.label}
                    </DropdownMenuLabel>
                    {group.items.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link
                          href={child.href}
                          onClick={onItemClick}
                          className="text-muted-foreground rounded-lg px-3 py-1.5 text-sm"
                        >
                          {child.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                ))}
              </div>
              {footerItem ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link
                        href={footerItem.href}
                        onClick={onItemClick}
                        className="rounded-lg px-3 py-2 text-sm font-medium"
                      >
                        {footerItem.label}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              ) : null}
            </>
          ) : (
            <DropdownMenuGroup>
              {(items ?? []).map((child) => (
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
            </DropdownMenuGroup>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
