"use client";

import { createClient } from "@/src/business/utils/supabase/client";
import { Link } from "@/src/i18n/routing";
import { User } from "lucide-react";
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

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const t = useTranslations("Header");

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
    });

    return () => {
      subscription.unsubscribe();
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
              <User className="text-foreground size-5" />
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
