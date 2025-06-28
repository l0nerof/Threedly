import Header from "@/business/components/Header";
import Hero from "@/business/components/Hero";
// import { FeaturedModels } from "@/components/featured-models"
// import { ModelCategories } from "@/components/model-categories"

import { Button } from "@/shared/components/Button";
import Footer from "@/shared/components/Footer";
import { ArrowRight, Search, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Header />
      <main>
        <Hero />
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Рекомендовані моделі
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Познайомтеся з нашим каталогом найкращих 3D-моделей для ваших
                  проектів.
                </p>
              </div>
            </div>
            {/* <FeaturedModels /> */}
            <div className="mt-8 flex justify-center">
              <Button variant="outline" className="gap-1" asChild>
                <Link href="/catalog">
                  Подивитися всі моделі <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        <section className="w-full bg-muted py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Подивитися за категоріями
                </h2>
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
                    Всі моделі ретельно перевіряються на якість та технічну
                    відмінність.
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
                    Нові моделі додаються щодня від нашої спільноти талановитих
                    3D-художників.
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
                    Наш пошук та фільтрація роблять пошук найкращої моделі
                    простим.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
