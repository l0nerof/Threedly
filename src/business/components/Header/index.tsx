// "use client"
// import { useEffect, useState } from "react"
import ThemeSwitcher from "@/business/components/ThemeSwitcher";
// import Image from "next/image"
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import { Button } from "@/shared/components/Button";
import Logo from "@/shared/components/Logo";
import Link from "next/link";
import BurgerMenu from "./components/BurgerMenu";
import Navigation from "./components/Navigation";

// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/shared/components/DropdownMenu"

function Header() {
  //   const [isLoggedIn, setIsLoggedIn] = useState(false)
  //   const [userName, setUserName] = useState("")
  //   const [loading, setLoading] = useState(true)
  //   const supabase = createClientComponentClient()

  //   useEffect(() => {
  //     const checkUser = async () => {
  //       try {
  //         const { data } = await supabase.auth.getSession()

  //         if (data.session) {
  //           setIsLoggedIn(true)

  //           // Get user metadata
  //           const { data: userData } = await supabase.auth.getUser()
  //           if (userData?.user) {
  //             const firstName = userData.user.user_metadata?.first_name || ""
  //             const lastName = userData.user.user_metadata?.last_name || ""

  //             if (firstName || lastName) {
  //               setUserName(`${firstName} ${lastName}`.trim())
  //             } else {
  //               setUserName(userData.user.email?.split("@")[0] || "User")
  //             }
  //           }
  //         } else {
  //           setIsLoggedIn(false)
  //           setUserName("")
  //         }
  //       } catch (error) {
  //         console.error("Error checking authentication:", error)
  //       } finally {
  //         setLoading(false)
  //       }
  //     }

  //     checkUser()

  //     // Set up auth state change listener
  //     const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
  //       if (event === "SIGNED_IN" && session) {
  //         setIsLoggedIn(true)
  //         const firstName = session.user.user_metadata?.first_name || ""
  //         const lastName = session.user.user_metadata?.last_name || ""

  //         if (firstName || lastName) {
  //           setUserName(`${firstName} ${lastName}`.trim())
  //         } else {
  //           setUserName(session.user.email?.split("@")[0] || "User")
  //         }
  //       } else if (event === "SIGNED_OUT") {
  //         setIsLoggedIn(false)
  //         setUserName("")
  //       }
  //     })

  //     return () => {
  //       authListener.subscription.unsubscribe()
  //     }
  //   }, [supabase])

  //   const handleSignOut = async () => {
  //     try {
  //       await supabase.auth.signOut()
  //       window.location.href = "/"
  //     } catch (error) {
  //       console.error("Error signing out:", error)
  //     }
  //   }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <Navigation />
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 md:flex">
            {/* {!loading && (
              <>
                {isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline-block">{userName}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Профіль</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile?tab=favorites">Мої улюблені</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile?tab=uploads">Мої моделі</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>Вийти</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <> */}
            <Button variant="outline" asChild>
              <Link href="/login">Увійти</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Зареєструватися</Link>
            </Button>
            {/* </> */}
            {/* )}
              </>
            )} */}
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
