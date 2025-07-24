"use client";

import { navigationMenuItems } from "@/business/constants/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/shared/components/NavigationMenu";
import cn from "@/shared/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Navigation() {
  const pathname = usePathname();

  return (
    <NavigationMenu>
      <NavigationMenuList className="hidden gap-6 lg:flex">
        {navigationMenuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <NavigationMenuItem key={item.title}>
              <NavigationMenuLink
                className={cn(
                  "group relative inline-flex h-9 w-max items-center justify-center p-2 text-sm font-medium",
                  "before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:scale-x-0 before:bg-primary before:transition-transform",
                  "hover:bg-transparent hover:before:scale-x-100",
                  "focus:outline-hidden focus:before:scale-x-100",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "data-active:before:scale-x-100 data-[state=open]:before:scale-x-100",
                )}
                asChild
                active={isActive}
              >
                <Link href={item.href}>{item.title}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export default Navigation;
