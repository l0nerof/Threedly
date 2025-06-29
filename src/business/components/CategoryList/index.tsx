import { Card, CardContent } from "@/shared/components/Card";
import {
  Building2,
  Car,
  Rocket,
  Shapes,
  Shirt,
  Sofa,
  TreePine,
  Users,
} from "lucide-react";
import Link from "next/link";

const categories = [
  {
    name: "Архітектура",
    icon: <Building2 className="h-8 w-8" />,
    count: 1243,
    color: "bg-blue-100 dark:bg-blue-950",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    name: "Меблі",
    icon: <Sofa className="h-8 w-8" />,
    count: 865,
    color: "bg-amber-100 dark:bg-amber-950",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    name: "Персонажі",
    icon: <Users className="h-8 w-8" />,
    count: 1432,
    color: "bg-green-100 dark:bg-green-950",
    textColor: "text-green-600 dark:text-green-400",
  },
  {
    name: "Транспорт",
    icon: <Car className="h-8 w-8" />,
    count: 976,
    color: "bg-red-100 dark:bg-red-950",
    textColor: "text-red-600 dark:text-red-400",
  },
  {
    name: "Природа",
    icon: <TreePine className="h-8 w-8" />,
    count: 754,
    color: "bg-emerald-100 dark:bg-emerald-950",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "Абстрактні",
    icon: <Shapes className="h-8 w-8" />,
    count: 543,
    color: "bg-purple-100 dark:bg-purple-950",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    name: "Наукова фантастика",
    icon: <Rocket className="h-8 w-8" />,
    count: 687,
    color: "bg-indigo-100 dark:bg-indigo-950",
    textColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    name: "Мода",
    icon: <Shirt className="h-8 w-8" />,
    count: 421,
    color: "bg-pink-100 dark:bg-pink-950",
    textColor: "text-pink-600 dark:text-pink-400",
  },
];

export function CategoryList() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.name}
          href={`/category/${category.name.toLowerCase()}`}
        >
          <Card className="overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className={`rounded-full p-3 ${category.color}`}>
                  <div className={category.textColor}>{category.icon}</div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.count} моделей
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
