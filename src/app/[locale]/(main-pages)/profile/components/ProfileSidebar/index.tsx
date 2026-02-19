"use client";

import { sidebarItems } from "@/src/business/constants/sidebarItems";
import { Link, usePathname } from "@/src/i18n/routing";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/shared/components/Sidebar";
import { useTranslations } from "next-intl";

export function ProfileSidebar() {
  const t = useTranslations("Profile");
  const pathname = usePathname();

  return (
    <Sidebar collapsible="none" className="rounded-xl border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.title")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/profile" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        {t(`sidebar.items.${item.key}`)}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
