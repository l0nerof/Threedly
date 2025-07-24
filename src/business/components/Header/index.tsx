import ThemeSwitcher from "@/business/components/ThemeSwitcher";
import { createClient } from "@/business/utils/supabase/server";
import { Button } from "@/shared/components/Button";
import Logo from "@/shared/components/Logo";
import Link from "next/link";
import BurgerMenu from "./components/BurgerMenu";
import Navigation from "./components/Navigation";
import UserMenu from "./components/UserMenu";

async function Header() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const isLoggedIn = !error && data?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <Navigation />
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 md:flex">
            {isLoggedIn ? (
              <UserMenu />
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Увійти</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Зареєструватися</Link>
                </Button>
              </>
            )}
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <ThemeSwitcher />
          </div>
          <BurgerMenu />
        </div>
      </div>
    </header>
  );
}

export default Header;
