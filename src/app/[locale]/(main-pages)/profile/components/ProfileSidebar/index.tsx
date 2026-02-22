"use client";

import { ProfileAvatar } from "@/src/business/components/ProfileAvatar";
import { sidebarItems } from "@/src/business/constants/sidebarItems";
import { createClient } from "@/src/business/utils/supabase/client";
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
import { useEffect, useState } from "react";
import { signOutAction } from "../../settings/actions";

export function ProfileSidebar() {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const pathname = usePathname();
  const signOutWithLocale = signOutAction.bind(null, locale);
  const [username, setUsername] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || isCancelled) {
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_path")
        .eq("id", user.id)
        .maybeSingle();

      if (isCancelled) {
        return;
      }

      setUsername(profile?.username ?? "");
      setAvatarPath(profile?.avatar_path ?? null);
      setEmail(user.email ?? "");
    };

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <Sidebar collapsible="none" className="rounded-xl border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-center gap-3 text-center">
                <ProfileAvatar avatarPath={avatarPath} className="size-24" />
                <p className="text-sm font-medium">{username || email}</p>
              </div>
              {username && (
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="flex items-center justify-center transition-colors duration-300"
                    >
                      <Link href={`/designers/${username}`}>
                        {t("sidebar.viewPublicProfile")}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              ) }
            </div>

            <SidebarSeparator className="mx-0 my-2" />

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
