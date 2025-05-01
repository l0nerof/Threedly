import Link from "next/link"
import { ArrowRight, Search, TrendingUp, Zap } from "lucide-react"

import { Button } from "@/shared/components/Button"
import { Input } from "@/shared/components/Input"
// import { FeaturedModels } from "@/components/featured-models"
// import { ModelCategories } from "@/components/model-categories"
import ThreeDPreview from "@/shared/components/3dPreview"
import Header from "@/business/components/Header"
import Footer from "@/shared/components/Footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden">
          <ThreeDPreview />
          <div className="container relative px-4 md:px-6 z-10">
            <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 dark:from-primary dark:to-purple-400">
                  Знайдіть найкращі 3D моделі
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Підсилюйте свої творчі проекти високоякісними 3D-активами від кращих дизайнерів світу.
                </p>
              </div>
              <div className="w-full max-w-md space-y-2">
                <div className="flex space-x-2">
                  <Input placeholder="Пошук 3D-моделей..." className="max-w-lg flex-1" />
                  <Button type="submit">Пошук</Button>
                </div>
                <p className="text-xs text-muted-foreground">Спробуйте шукати: архітектура, персонажі, транспорт</p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild variant="outline" className="group">
                  <Link href="/catalog">
                    Каталог
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Почати</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Рекомендовані моделі</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Познайомтеся з нашим каталогом найкращих 3D-моделей для ваших проектів.
                </p>
              </div>
            </div>
            {/* <FeaturedModels /> */}
            <div className="flex justify-center mt-8">
              <Button variant="outline" className="gap-1" asChild>
                <Link href="/catalog">
                  Подивитися всі моделі <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Подивитися за категоріями</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Знайдіть найкращу 3D-модель для ваших конкретних потреб.
                </p>
              </div>
            </div>
            {/* <ModelCategories /> */}
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Zap className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Високоякісні моделі</h3>
                  <p className="text-muted-foreground">
                    Всі моделі ретельно перевіряються на якість та технічну відмінність.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Регулярні оновлення</h3>
                  <p className="text-muted-foreground">
                    Нові моделі додаються щодня від нашої спільноти талановитих 3D-художників.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Search className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Легкий пошук</h3>
                  <p className="text-muted-foreground">
                    Наш пошук та фільтрація роблять пошук найкращої моделі простим.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}