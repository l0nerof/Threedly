"use client";

import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/shared/components/Card";
import { Download, Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const featuredModels = [
  {
    id: 1,
    title: "Geometric Sculpture",
    description: "Abstract geometric sculpture with complex facets",
    image: "/placeholder.svg?height=300&width=400",
    price: "$49",
    category: "Абстрактні",
    author: "Alex Chen",
    likes: 243,
    downloads: 1.2,
  },
  {
    id: 2,
    title: "Modern Chair",
    description: "Minimalist chair design with organic curves",
    image: "/placeholder.svg?height=300&width=400",
    price: "$29",
    category: "Меблі",
    author: "Maria Lopez",
    likes: 187,
    downloads: 0.9,
  },
  {
    id: 3,
    title: "Futuristic Building",
    description: "Sci-fi inspired architectural concept",
    image: "/placeholder.svg?height=300&width=400",
    price: "$79",
    category: "Архітектура",
    author: "James Wilson",
    likes: 312,
    downloads: 1.5,
  },
  {
    id: 4,
    title: "Crystalline Structure",
    description: "Complex crystal formation with realistic materials",
    image: "/placeholder.svg?height=300&width=400",
    price: "$39",
    category: "Природа",
    author: "Sophia Kim",
    likes: 156,
    downloads: 0.7,
  },
];

function FeaturedModelsList() {
  const [likedModels, setLikedModels] = useState<number[]>([]);

  const toggleLike = (id: number) => {
    if (likedModels.includes(id)) {
      setLikedModels(likedModels.filter((modelId) => modelId !== id));
    } else {
      setLikedModels([...likedModels, id]);
    }
  };

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {featuredModels.map((model) => (
        <Card
          key={model.id}
          className="overflow-hidden shadow-xs shadow-black/10 transition-all duration-300 hover:shadow-lg dark:shadow-white/10"
        >
          <CardHeader className="p-0">
            <div className="relative">
              <img
                src={model.image || "/placeholder.svg"}
                alt={model.title}
                className="aspect-4/3 w-full object-cover"
              />
              <Badge className="absolute right-2 top-2">{model.category}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{model.title}</h3>
                <span className="font-bold">{model.price}</span>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {model.description}
              </p>
              <div className="text-xs text-muted-foreground">
                by{" "}
                <Link href="#" className="hover:underline">
                  {model.author}
                </Link>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between p-4 pt-0">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleLike(model.id)}
              >
                <Heart
                  className={`h-4 w-4 ${likedModels.includes(model.id) ? "fill-red-500 text-red-500" : ""}`}
                />
                <span className="sr-only">Like</span>
              </Button>
              <span className="text-xs text-muted-foreground">
                {model.likes}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {model.downloads}k
              </span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default FeaturedModelsList;
