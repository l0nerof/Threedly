import ThemeSwitcher from "@/business/components/ThemeSwitcher";
import { Button } from "@/shared/components/Button";
import Logo from "@/shared/components/Logo";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/Sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import React from "react";

function BurgerMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <div className="flex flex-col gap-4 py-4">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
          </div>
          <nav className="flex flex-col gap-2">
            <Link
              href="/catalog"
              className="hover:text-primary py-2 text-sm font-medium transition-colors"
            >
              Каталог
            </Link>
            <Link
              href="/categories"
              className="hover:text-primary py-2 text-sm font-medium transition-colors"
            >
              Категорії
            </Link>
            <Link
              href="/designers"
              className="hover:text-primary py-2 text-sm font-medium transition-colors"
            >
              Дизайнери
            </Link>
            <Link
              href="/pricing"
              className="hover:text-primary py-2 text-sm font-medium transition-colors"
            >
              Ціни
            </Link>
          </nav>
          {/* <div className="flex flex-col gap-2 mt-4">
                  {!loading && (
                    <>
                      {isLoggedIn ? (
                        <>
                          <div className="font-medium mb-2">Привіт, {userName}</div>
                          <Button variant="outline" asChild className="w-full">
                            <Link href="/profile">Мій профіль</Link>
                          </Button>
                          <Button variant="outline" asChild className="w-full">
                            <Link href="/profile?tab=favorites">Мої улюблені</Link>
                          </Button>
                          <Button variant="outline" asChild className="w-full">
                            <Link href="/profile?tab=uploads">Мої моделі</Link>
                          </Button>
                          <Button variant="outline" className="w-full" onClick={handleSignOut}>
                            Вийти
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" asChild className="w-full">
                            <Link href="/login">Увійти</Link>
                          </Button>
                          <Button asChild className="w-full">
                            <Link href="/signup">Зареєструватися</Link>
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>*/}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default BurgerMenu;
