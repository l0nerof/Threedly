"use client";

import { ProfileAvatar } from "@/src/business/components/ProfileAvatar";
import { sidebarItems } from "@/src/business/constants/sidebarItems";
import { createClient } from "@/src/business/utils/supabase/client";
import { Link, usePathname } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
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
import { Skeleton } from "@/src/shared/components/Skeleton";
import { LogOutIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { signOutAction } from "../../settings/actions";

const PROFILE_AVATAR_UPDATED_EVENT = "profile-avatar-updated";

export function ProfileSidebar() {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const pathname = usePathname();
  const signOutWithLocale = signOutAction.bind(null, locale);
  const [username, setUsername] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || isCancelled) {
        if (!isCancelled) {
          setIsLoadingProfile(false);
        }
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
      setIsLoadingProfile(false);
    };

    void loadProfile();

    const handleAvatarUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ avatarPath: string | null }>;
      setAvatarPath(customEvent.detail.avatarPath);
    };
    window.addEventListener(PROFILE_AVATAR_UPDATED_EVENT, handleAvatarUpdated);

    return () => {
      isCancelled = true;
      window.removeEventListener(
        PROFILE_AVATAR_UPDATED_EVENT,
        handleAvatarUpdated,
      );
    };
  }, []);

  return (
    <Sidebar
      collapsible="none"
      className="border-border/60 bg-surface/95 rounded-3xl border shadow-sm md:sticky md:top-28"
    >
      <SidebarContent>
        <SidebarGroup className="p-4">
          <SidebarGroupContent>
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-col items-center gap-3 text-center">
                <ProfileAvatar avatarPath={avatarPath} className="size-20" />
                {isLoadingProfile ? (
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-medium">{username || email}</p>
                    <p className="text-muted-foreground max-w-52 truncate text-xs">
                      {email || t("emptyEmail")}
                    </p>
                  </div>
                )}
              </div>
              {isLoadingProfile ? (
                <Skeleton className="h-9 w-full rounded-xl" />
              ) : (
                username && (
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto w-full rounded-xl px-4 py-2 text-center whitespace-normal"
                  >
                    <Link href={`/designers/${username}`}>
                      {t("sidebar.viewPublicProfile")}
                    </Link>
                  </Button>
                )
              )}
            </div>

            <SidebarSeparator className="mx-0 my-3" />

            <SidebarMenu className="gap-1.5">
              {sidebarItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/profile" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      size="lg"
                      isActive={isActive}
                      className="rounded-xl transition-colors duration-300"
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

            <SidebarSeparator className="mx-0 my-3" />

            <form action={signOutWithLocale}>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    type="submit"
                    size="lg"
                    className="text-destructive hover:text-destructive/80 cursor-pointer rounded-xl transition-colors duration-300"
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
