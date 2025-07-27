import Header from "@/business/components/Header";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/Card";
import Footer from "@/shared/components/Footer";
import { Input } from "@/shared/components/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/Select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/Tabs";
import { ArrowRight, Grid3X3, List, Search, Users } from "lucide-react";
import {
  Building2,
  Car,
  Rocket,
  Shapes,
  Shirt,
  Sofa,
  TreePine,
} from "lucide-react";
import Link from "next/link";

const categories = [
  {
    name: "Архітектура",
    icon: <Building2 className="h-8 w-8" />,
    count: 1243,
    trending: 156,
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    lightColor: "bg-blue-100 dark:bg-blue-950",
    textColor: "text-blue-600 dark:text-blue-400",
    description: "Будівлі та міста",
    topModels: [
      {
        id: 1,
        title: "Modern Skyscraper",
        price: "$89",
        downloads: "2.1k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 2,
        title: "Gothic Cathedral",
        price: "$65",
        downloads: "1.8k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 3,
        title: "Futuristic City",
        price: "$120",
        downloads: "3.2k",
        image: "/placeholder.svg?height=200&width=300",
      },
    ],
  },
  {
    name: "Персонажі",
    icon: <Users className="h-8 w-8" />,
    count: 1432,
    trending: 203,
    color: "bg-gradient-to-br from-green-500 to-green-600",
    lightColor: "bg-green-100 dark:bg-green-950",
    textColor: "text-green-600 dark:text-green-400",
    description: "Різноманітні персонажі",
    topModels: [
      {
        id: 4,
        title: "Warrior Knight",
        price: "$75",
        downloads: "2.8k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 5,
        title: "Sci-Fi Soldier",
        price: "$69",
        downloads: "2.3k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 6,
        title: "Fantasy Mage",
        price: "$82",
        downloads: "1.9k",
        image: "/placeholder.svg?height=200&width=300",
      },
    ],
  },
  {
    name: "Транспорт",
    icon: <Car className="h-8 w-8" />,
    count: 976,
    trending: 134,
    color: "bg-gradient-to-br from-red-500 to-red-600",
    lightColor: "bg-red-100 dark:bg-red-950",
    textColor: "text-red-600 dark:text-red-400",
    description: "Транспорт на землі, повітрі та воді",
    topModels: [
      {
        id: 7,
        title: "Sports Car",
        price: "$95",
        downloads: "3.5k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 8,
        title: "Fighter Jet",
        price: "$110",
        downloads: "2.7k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 9,
        title: "Vintage Motorcycle",
        price: "$58",
        downloads: "1.6k",
        image: "/placeholder.svg?height=200&width=300",
      },
    ],
  },
  {
    name: "Меблі",
    icon: <Sofa className="h-8 w-8" />,
    count: 865,
    trending: 89,
    color: "bg-gradient-to-br from-amber-500 to-amber-600",
    lightColor: "bg-amber-100 dark:bg-amber-950",
    textColor: "text-amber-600 dark:text-amber-400",
    description: "Інтер'єр та меблі",
    topModels: [
      {
        id: 10,
        title: "Modern Sofa",
        price: "$45",
        downloads: "1.4k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 11,
        title: "Office Chair",
        price: "$38",
        downloads: "1.1k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 12,
        title: "Dining Table",
        price: "$52",
        downloads: "987",
        image: "/placeholder.svg?height=200&width=300",
      },
    ],
  },
  {
    name: "Природа",
    icon: <TreePine className="h-8 w-8" />,
    count: 754,
    trending: 112,
    color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    lightColor: "bg-emerald-100 dark:bg-emerald-950",
    textColor: "text-emerald-600 dark:text-emerald-400",
    description: "Дерева, рослини та ландшафти",
    topModels: [
      {
        id: 13,
        title: "Ancient Tree",
        price: "$42",
        downloads: "1.8k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 14,
        title: "Mountain Range",
        price: "$67",
        downloads: "2.1k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 15,
        title: "Tropical Forest",
        price: "$89",
        downloads: "1.5k",
        image: "/placeholder.svg?height=200&width=300",
      },
    ],
  },
  {
    name: "Наукова фантастика",
    icon: <Rocket className="h-8 w-8" />,
    count: 687,
    trending: 178,
    color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    lightColor: "bg-indigo-100 dark:bg-indigo-950",
    textColor: "text-indigo-600 dark:text-indigo-400",
    description: "Наукова фантастика та об'єкти",
    topModels: [
      {
        id: 16,
        title: "Space Station",
        price: "$125",
        downloads: "2.9k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 17,
        title: "Robot Companion",
        price: "$78",
        downloads: "2.2k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 18,
        title: "Alien Spacecraft",
        price: "$98",
        downloads: "1.7k",
        image: "/placeholder.svg?height=200&width=300",
      },
    ],
  },
  {
    name: "Абстракція",
    icon: <Shapes className="h-8 w-8" />,
    count: 543,
    trending: 67,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    lightColor: "bg-purple-100 dark:bg-purple-950",
    textColor: "text-purple-600 dark:text-purple-400",
    description: "Абстракція та геометричні дизайни",
    topModels: [
      {
        id: 19,
        title: "Geometric Sculpture",
        price: "$49",
        downloads: "1.2k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 20,
        title: "Abstract Waves",
        price: "$55",
        downloads: "1.0k",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 21,
        title: "Crystalline Form",
        price: "$39",
        downloads: "876",
        image: "/placeholder.svg?height=200&width=300",
      },
    ],
  },
  {
    name: "Мода",
    icon: <Shirt className="h-8 w-8" />,
    count: 421,
    trending: 45,
    color: "bg-gradient-to-br from-pink-500 to-pink-600",
    lightColor: "bg-pink-100 dark:bg-pink-950",
    textColor: "text-pink-600 dark:text-pink-400",
    description: "Одяг та аксесуари",
    topModels: [
      {
        id: 22,
        title: "Designer Dress",
        price: "$42",
        downloads: "743",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 23,
        title: "Luxury Watch",
        price: "$38",
        downloads: "654",
        image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 24,
        title: "Running Shoes",
        price: "$35",
        downloads: "892",
        image: "/placeholder.svg?height=200&width=300",
      },
    ],
  },
];

export default function CategoriesPage() {
  // const [searchTerm, setSearchTerm] = useState("");
  // const [sortBy, setSortBy] = useState("popular");
  // const [viewMode, setViewMode] = useState("grid");
  // const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // const [filteredCategories, setFilteredCategories] = useState(categories);

  // useEffect(() => {
  //   const filtered = categories.filter(
  //     (category) =>
  //       category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       category.description.toLowerCase().includes(searchTerm.toLowerCase()),
  //   );

  //   // Sort categories
  //   switch (sortBy) {
  //     case "popular":
  //       filtered.sort((a, b) => b.count - a.count);
  //       break;
  //     case "trending":
  //       filtered.sort((a, b) => b.trending - a.trending);
  //       break;
  //     case "name":
  //       filtered.sort((a, b) => a.name.localeCompare(b.name));
  //       break;
  //   }

  //   setFilteredCategories(filtered);
  // }, [searchTerm, sortBy]);

  // const totalModels = categories.reduce((sum, cat) => sum + cat.count, 0);
  // const totalTrending = categories.reduce((sum, cat) => sum + cat.trending, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="from-primary/5 relative bg-gradient-to-br via-purple-500/5 to-blue-500/5 py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="space-y-6 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  Перегляд категорій
                </h1>
                <p className="text-muted-foreground mx-auto max-w-[700px] md:text-xl">
                  Перегляньте нашу уважно підібрану колекцію преміум 3D моделей
                  в {categories.length} категоріях
                </p>
              </div>

              {/* Platform Info */}
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="border-b py-8">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex w-full items-center gap-4 md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Пошук категорій..."
                    // value={searchTerm}
                    // onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Сортувати за" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Популярні</SelectItem>
                    <SelectItem value="trending">Популярні</SelectItem>
                    <SelectItem value="name">Ім&apos;я</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid/List */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="overview">Огляд</TabsTrigger>
                <TabsTrigger value="detailed">Детальний перегляд</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div
                  className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
                >
                  {categories.map((category) => (
                    <Card
                      key={category.name}
                      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg"
                    >
                      <div
                        className={`h-32 ${category.color} relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          {category.icon}
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold">
                              {category.name}
                            </h3>
                            <span className="text-muted-foreground text-sm">
                              {category.count} моделей
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {category.description}
                          </p>
                          <div className="flex items-center justify-between pt-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/catalog?category=${category.name.toLowerCase()}`}
                              >
                                Переглянути{" "}
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                            <div className="text-muted-foreground text-xs">
                              {category.trending} популярних
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="detailed">
                <div className="space-y-8">
                  {categories.map((category) => (
                    <Card key={category.name} className="overflow-hidden">
                      <CardHeader className={`${category.color} text-white`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {category.icon}
                            <div>
                              <CardTitle className="text-2xl">
                                {category.name}
                              </CardTitle>
                              <CardDescription className="text-white/80">
                                {category.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {category.count}
                            </div>
                            <div className="text-sm text-white/80">моделей</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold">
                              Популярні моделі
                            </h4>
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/catalog?category=${category.name.toLowerCase()}`}
                              >
                                Переглянути всі{" "}
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {category.topModels.map((model) => (
                              <Card key={model.id} className="overflow-hidden">
                                <div className="relative">
                                  <img
                                    src={model.image || "/placeholder.svg"}
                                    alt={model.title}
                                    className="aspect-[3/2] w-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-2 left-2 text-white">
                                    <div className="text-sm font-semibold">
                                      {model.title}
                                    </div>
                                    <div className="text-xs opacity-80">
                                      {model.downloads} завантажень
                                    </div>
                                  </div>
                                  <div className="absolute top-2 right-2">
                                    <Badge className="border-white/30 bg-white/20 text-white">
                                      {model.price}
                                    </Badge>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
