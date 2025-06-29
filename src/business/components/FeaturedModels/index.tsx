import { Button } from "@/shared/components/Button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import FeaturedModelsList from "../FeaturedModelsList";

function FeaturedModels() {
  return (
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
        <FeaturedModelsList />
        <div className="mt-8 flex justify-center">
          <Button variant="outline" className="gap-1 bg-transparent" asChild>
            <Link href="/catalog">
              Подивитися всі моделі <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default FeaturedModels;
