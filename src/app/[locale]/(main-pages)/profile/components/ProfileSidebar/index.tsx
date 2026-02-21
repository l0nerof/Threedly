"use client";

import { sidebarItems } from "@/src/business/constants/sidebarItems";
import { Link, usePathname } from "@/src/i18n/routing";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/src/shared/components/Sidebar";
import { LogOutIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { signOutAction } from "../../settings/actions";

export function ProfileSidebar() {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const pathname = usePathname();
  const signOutWithLocale = signOutAction.bind(null, locale);

  return (
    <Sidebar collapsible="none" className="rounded-xl border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/profile" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="transition-colors duration-300"
                    >
                      <Link href={item.href}>
                        <item.icon className="size-5" />

                        {t(`sidebar.items.${item.key}`)}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            <SidebarSeparator className="mx-0 my-2" />

            <form action={signOutWithLocale}>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    type="submit"
                    className="text-destructive hover:text-destructive/80 cursor-pointer transition-colors duration-300"
                  >
                    <LogOutIcon className="size-5" />

                    {t("settings.account.signOut")}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </form>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
