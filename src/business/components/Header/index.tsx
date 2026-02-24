"use client";

import { ProfileAvatar } from "@/src/business/components/ProfileAvatar";
import { createClient } from "@/src/business/utils/supabase/client";
import { Link } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { navItems } from "../../constants/navItems";
import { LanguageToggle } from "../LanguageToggle";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  NavItems,
  Navbar,
  NavbarButton,
  NavbarLogo,
} from "../Navbar";
import { ThemeToggle } from "../ThemeToggle";

const PROFILE_AVATAR_UPDATED_EVENT = "profile-avatar-updated";

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const t = useTranslations("Header");

  useEffect(() => {
    const supabase = createClient();

    const loadCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setAvatarPath(null);
        return;
      }

      setIsAuthenticated(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_path")
        .eq("id", user.id)
        .maybeSingle();

      setAvatarPath(profile?.avatar_path ?? null);
    };

    void loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      if (!session) {
        setAvatarPath(null);
        return;
      }

      void supabase
        .from("profiles")
        .select("avatar_path")
        .eq("id", session.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          setAvatarPath(profile?.avatar_path ?? null);
        });
    });

    const handleAvatarUpdated = (
      event: Event,
    ) => {
      const customEvent = event as CustomEvent<{ avatarPath: string | null }>;
      setAvatarPath(customEvent.detail.avatarPath);
    };
    window.addEventListener(PROFILE_AVATAR_UPDATED_EVENT, handleAvatarUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(
        PROFILE_AVATAR_UPDATED_EVENT,
        handleAvatarUpdated,
      );
    };
  }, []);

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />

        <div className="flex items-center gap-1">
          {isAuthenticated === true ? (
            <NavbarButton
              variant="secondary"
              as={Link}
              href="/profile"
              className="p-2"
            >
              <ProfileAvatar
                avatarPath={avatarPath}
                className="size-5 bg-transparent"
                iconClassName="size-4"
              />
            </NavbarButton>
          ) : isAuthenticated === false ? (
            <>
              <NavbarButton variant="secondary" as={Link} href="/login">
                {t("login")}
              </NavbarButton>
              <NavbarButton variant="primary" as={Link} href="/signup">
                {t("signup")}
              </NavbarButton>
            </>
          ) : null}
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <Link
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-foreground relative"
            >
              {t(item.name)}
            </Link>
          ))}

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          <div className="flex w-full flex-col gap-2">
            {isAuthenticated === true ? (
              <NavbarButton
                as={Link}
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                {t("profile")}
              </NavbarButton>
            ) : isAuthenticated === false ? (
              <>
                <NavbarButton
                  as={Link}
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="primary"
                  className="w-full"
                >
                  {t("login")}
                </NavbarButton>
                <NavbarButton
                  as={Link}
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="primary"
                  className="w-full"
                >
                  {t("signup")}
                </NavbarButton>
              </>
            ) : null}
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}

export default Header;
