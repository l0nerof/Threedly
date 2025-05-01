// "use client"

// import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Menu, User } from "lucide-react"
// import Image from "next/image"
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import { Button } from "@/shared/components/Button"
import { Input } from "@/shared/components/Input"
import ThemeSwitcher from "@/business/components/ThemeSwitcher"
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/Sheet"
import Logo from "@/shared/components/Logo"
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
          <nav className="hidden md:flex gap-6">
            <Link href="/catalog" className="text-sm font-medium transition-colors hover:text-primary">
              Каталог
            </Link>
            <Link href="/categories" className="text-sm font-medium transition-colors hover:text-primary">
              Категорії
            </Link>
            <Link href="/artists" className="text-sm font-medium transition-colors hover:text-primary">
              Артисти
            </Link>
            <Link href="/pricing" className="text-sm font-medium transition-colors hover:text-primary">
              Ціни
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full max-w-sm items-center">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Пошук моделі..."
              className="w-full rounded-full bg-background pl-8 pr-4 py-1 h-9 md:w-[300px] lg:w-[300px]"
            />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <ThemeSwitcher />
          </div>
          {/* <div className="hidden md:flex items-center gap-2">
            {!loading && (
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
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/login">Увійти</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/register">Зареєструватися</Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </div> */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
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
                  <Link href="/catalog" className="text-sm font-medium py-2 transition-colors hover:text-primary">
                    Каталог
                  </Link>
                  <Link href="/categories" className="text-sm font-medium py-2 transition-colors hover:text-primary">
                    Категорії
                  </Link>
                  <Link href="/artists" className="text-sm font-medium py-2 transition-colors hover:text-primary">
                    Артисти
                  </Link>
                  <Link href="/pricing" className="text-sm font-medium py-2 transition-colors hover:text-primary">
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
                            <Link href="/register">Зареєструватися</Link>
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>*/}
              </div> 
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Header;