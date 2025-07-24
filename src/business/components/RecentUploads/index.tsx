import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { Card, CardContent } from "@/shared/components/Card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const recentUploads = [
  {
    id: 1,
    title: "Cyberpunk Motorcycle",
    author: "TechArtist",
    timeAgo: "2 годин тому",
    image: "/placeholder.svg?height=200&width=300",
    price: "$65",
    category: "Транспорт",
  },
  {
    id: 2,
    title: "Medieval Castle",
    author: "HistoryBuilder",
    timeAgo: "4 годин тому",
    image: "/placeholder.svg?height=200&width=300",
    price: "$89",
    category: "Архітектура",
  },
  {
    id: 3,
    title: "Alien Creature",
    author: "SciFiMaster",
    timeAgo: "6 годин тому",
    image: "/placeholder.svg?height=200&width=300",
    price: "$72",
    category: "Персонажі",
  },
  {
    id: 4,
    title: "Modern Kitchen",
    author: "InteriorPro",
    timeAgo: "8 годин тому",
    image: "/placeholder.svg?height=200&width=300",
    price: "$45",
    category: "Меблі",
  },
];

function RecentUploads() {
  return (
    <section className="w-full bg-muted/30 py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter">
              Останні завантаження
            </h2>
            <p className="text-muted-foreground">
              Свіжий вміст від нашої спільноти
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/catalog?sort=newest">
              Подивитися всі <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recentUploads.map((model) => (
            <Card
              key={model.id}
              className="group overflow-hidden shadow-xs shadow-black/10 transition-all duration-300 hover:shadow-lg dark:shadow-white/10"
            >
              <div className="relative">
                <img
                  src={model.image || "/placeholder.svg"}
                  alt={model.title}
                  className="aspect-4/3 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <Badge className="absolute right-2 top-2">
                  {model.category}
                </Badge>
                <div className="absolute bottom-2 left-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="text-sm font-semibold">{model.title}</div>
                  <div className="text-xs">by {model.author}</div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate font-semibold">{model.title}</h3>
                    <span className="font-bold text-primary">
                      {model.price}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>by {model.author}</span>
                    <span>{model.timeAgo}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RecentUploads;
