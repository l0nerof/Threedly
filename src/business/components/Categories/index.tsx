import { Button } from "@/shared/components/Button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CategoryList } from "../CategoryList";

function Categories() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
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
        <CategoryList />
        <div className="mt-8 flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/categories">
              Подивитися всі категорії <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default Categories;
