"use client";

import { ProfileAvatar } from "@/src/business/components/ProfileAvatar";
import { createClient } from "@/src/business/utils/supabase/client";
import { Link } from "@/src/i18n/routing";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { navItems } from "../../constants/navItems";
import { LanguageToggle } from "../LanguageToggle";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  NavItemConfig,
  NavItems,
  Navbar,
  NavbarButton,
  NavbarLogo,
} from "../Navbar";
import { ThemeToggle } from "../ThemeToggle";

export type Category = {
  slug: string;
  name_ua: string;
  name_en: string;
};

type HeaderProps = {
  categories: Category[];
};

const PROFILE_AVATAR_UPDATED_EVENT = "profile-avatar-updated";

function Header({ categories }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const t = useTranslations("Header");
  const locale = useLocale();

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

    const handleAvatarUpdated = (event: Event) => {
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

  const navItemsWithCategories: NavItemConfig[] = navItems.map((item) => {
    if (item.name === "nav.categories" && categories.length > 0) {
      return {
        name: item.name,
        dropdown: categories.map((cat) => ({
          label: locale === "ua" ? cat.name_ua : cat.name_en,
          href: `/catalog?category=${cat.slug}`,
        })),
      };
    }
    return item;
  });

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItemsWithCategories} />

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
          {navItemsWithCategories.map((item, idx) => {
            if (item.dropdown) {
              return (
                <div key={`mobile-link-${idx}`} className="w-full">
                  <button
                    type="button"
                    onClick={() => setIsMobileCategoriesOpen((prev) => !prev)}
                    className="text-foreground flex items-center gap-1 py-1 text-sm font-medium"
                  >
                    {t(item.name)}
                    <ChevronDown
                      className={`size-4 transition-transform duration-200 ${isMobileCategoriesOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isMobileCategoriesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-2 pt-2 pb-1 pl-3">
                          {item.dropdown.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setIsMobileCategoriesOpen(false);
                              }}
                              className="text-muted-foreground text-sm"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            return (
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-foreground relative"
              >
                {t(item.name)}
              </Link>
            );
          })}

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
