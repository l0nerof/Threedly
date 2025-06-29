import ThreeDPreview from "@/shared/components/3dPreview";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import React from "react";

function Hero() {
  return (
    <section className="relative w-full overflow-hidden py-24 md:py-32 lg:py-40">
      <ThreeDPreview />
      <div className="container relative z-10 px-4 md:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center space-y-8 text-center">
          <div className="space-y-4">
            <div className="mb-5 flex items-center justify-center gap-2">
              <Badge className="border-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <Sparkles className="mr-1 size-4" />
                Запуск нової платформи
              </Badge>
            </div>

            <h1 className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-4xl font-bold tracking-tighter text-transparent sm:text-5xl md:text-6xl lg:text-7xl dark:from-primary dark:to-purple-400">
              Знайдіть найкращі 3D моделі
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Підсилюйте свої творчі проекти високоякісними 3D-активами від
              кращих дизайнерів світу.
            </p>
          </div>
          <div className="w-full max-w-md space-y-2">
            <div className="flex space-x-2">
              <Input
                placeholder="Пошук 3D-моделей..."
                className="max-w-lg flex-1"
              />
              <Button type="submit">Пошук</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Спробуйте шукати: архітектура, персонажі, транспорт
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
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
  );
}

export default Hero;
