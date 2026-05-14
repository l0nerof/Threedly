"use client";

import { ProfileAvatar } from "@/src/business/components/ProfileAvatar";
import { HEADER_FEATURED_CATEGORY_LIMIT } from "@/src/business/constants/header";
import { LocaleCode } from "@/src/business/constants/localization";
import type { CategoryGroupOption } from "@/src/business/types/category";
import type { NavItemConfig } from "@/src/business/types/navItemsConfig";
import { mapCategoryGroupRowsToOptions } from "@/src/business/utils/categories";
import { createClient } from "@/src/business/utils/supabase/client";
import { Link } from "@/src/i18n/routing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/shared/components/Accordion";
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
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroupOption[]>(
    [],
  );
  const t = useTranslations("Header");
  const locale = useLocale();

  useEffect(() => {
    const supabase = createClient();

    const loadCategories = async () => {
      const { data } = await supabase
        .from("category_groups")
        .select(
          "id, slug, name_ua, name_en, sort_order, categories(id, slug, name_ua, name_en, sort_order, is_featured)",
        )
        .order("sort_order", { ascending: true });

      setCategoryGroups(
        mapCategoryGroupRowsToOptions(data ?? [], locale as LocaleCode),
      );
    };

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

    void loadCategories();
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
  }, [locale]);

  const navItemsWithCategories: NavItemConfig[] = navItems.map((item) => {
    if (item.name === "nav.categories" && categoryGroups.length > 0) {
      return {
        name: item.name,
        dropdownGroups: categoryGroups.map((group) => ({
          label: group.label,
          href: `/catalog?group=${group.value}`,
          items: group.categories
            .filter((category) => category.isFeatured)
            .slice(0, HEADER_FEATURED_CATEGORY_LIMIT)
            .map((category) => ({
              label: category.label,
              href: `/catalog?category=${category.value}`,
            })),
        })),
        dropdownFooter: {
          label: t("allCategories"),
          href: "/catalog",
        },
      };
    }

    return item;
  });

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <Navbar>
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
                sizes="20px"
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

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu}>
          {navItemsWithCategories.map((item, idx) => {
            if ("dropdownGroups" in item) {
              return (
                <Accordion
                  key={`mobile-link-${idx}`}
                  type="single"
                  collapsible
                  className="w-full"
                >
                  <AccordionItem value="categories" className="border-b-0">
                    <AccordionTrigger className="text-foreground py-1 text-base font-normal hover:no-underline">
                      {t(item.name)}
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          {item.dropdownGroups.map((group) => (
                            <Link
                              key={group.href}
                              href={group.href}
                              onClick={closeMobileMenu}
                              className="border-border/60 bg-surface-elevated/45 text-foreground hover:border-primary/35 hover:bg-primary/8 rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
                            >
                              {group.label}
                            </Link>
                          ))}
                        </div>
                        <Link
                          href={item.dropdownFooter.href}
                          onClick={closeMobileMenu}
                          className="text-muted-foreground hover:text-foreground px-1 pt-1 text-sm font-medium transition-colors"
                        >
                          {item.dropdownFooter.label}
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            }

            if ("dropdown" in item && item.dropdown) {
              return (
                <Accordion
                  key={`mobile-link-${idx}`}
                  type="single"
                  collapsible
                  className="w-full"
                >
                  <AccordionItem value="categories" className="border-b-0">
                    <AccordionTrigger className="text-foreground py-1 text-base font-normal hover:no-underline">
                      {t(item.name)}
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="flex flex-col gap-2 pl-3">
                        {item.dropdown.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={closeMobileMenu}
                            className="text-muted-foreground text-sm"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            }

            return (
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={closeMobileMenu}
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
                onClick={closeMobileMenu}
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
                  onClick={closeMobileMenu}
                  variant="primary"
                  className="w-full"
                >
                  {t("login")}
                </NavbarButton>
                <NavbarButton
                  as={Link}
                  href="/signup"
                  onClick={closeMobileMenu}
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
