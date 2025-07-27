import Header from "@/business/components/Header";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { Card, CardContent } from "@/shared/components/Card";
import Footer from "@/shared/components/Footer";
import { Input } from "@/shared/components/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/Select";
import { Calendar, ExternalLink, MapPin, Search, Verified } from "lucide-react";
import {
  Building2,
  Car,
  Rocket,
  Shapes,
  Sofa,
  TreePine,
  Users,
} from "lucide-react";
import Link from "next/link";

const specialties = [
  { name: "Всі", icon: <Shapes className="h-4 w-4" />, count: 24 },
  { name: "Архітектура", icon: <Building2 className="h-4 w-4" />, count: 8 },
  { name: "Персонажі", icon: <Users className="h-4 w-4" />, count: 6 },
  { name: "Транспорт", icon: <Car className="h-4 w-4" />, count: 4 },
  { name: "Меблі", icon: <Sofa className="h-4 w-4" />, count: 3 },
  { name: "Природа", icon: <TreePine className="h-4 w-4" />, count: 2 },
  {
    name: "Наукова фантастика",
    icon: <Rocket className="h-4 w-4" />,
    count: 1,
  },
];

const artists = [
  {
    id: 1,
    name: "Alex Chen",
    username: "alexchen3d",
    avatar: "/placeholder.svg?height=120&width=120",
    coverImage: "/placeholder.svg?height=200&width=400",
    specialty: "Архітектура",
    location: "San Francisco, CA",
    joinedDate: "2024-01-15",
    bio: "Passionate architectural designer with 8+ years of experience creating stunning 3D visualizations for modern buildings and urban spaces.",
    website: "https://alexchen3d.com",
    isVerified: true,
    isFeatured: true,
    models: [
      {
        id: 1,
        title: "Modern Skyscraper",
        image: "/placeholder.svg?height=200&width=300",
        price: "$89",
      },
      {
        id: 2,
        title: "Glass Office Building",
        image: "/placeholder.svg?height=200&width=300",
        price: "$65",
      },
      {
        id: 3,
        title: "Residential Complex",
        image: "/placeholder.svg?height=200&width=300",
        price: "$120",
      },
    ],
    skills: ["Blender", "3ds Max", "AutoCAD", "SketchUp"],
  },
  {
    id: 2,
    name: "Maria Lopez",
    username: "marialopez",
    avatar: "/placeholder.svg?height=120&width=120",
    coverImage: "/placeholder.svg?height=200&width=400",
    specialty: "Персонажі",
    location: "Barcelona, Spain",
    joinedDate: "2024-01-20",
    bio: "Character artist specializing in fantasy and game-ready models. I love bringing imagination to life through detailed 3D characters.",
    website: "https://marialopez.art",
    isVerified: true,
    isFeatured: true,
    models: [
      {
        id: 4,
        title: "Fantasy Warrior",
        image: "/placeholder.svg?height=200&width=300",
        price: "$75",
      },
      {
        id: 5,
        title: "Sci-Fi Soldier",
        image: "/placeholder.svg?height=200&width=300",
        price: "$69",
      },
    ],
    skills: ["ZBrush", "Maya", "Substance Painter", "Marvelous Designer"],
  },
  {
    id: 3,
    name: "James Wilson",
    username: "jameswilson3d",
    avatar: "/placeholder.svg?height=120&width=120",
    coverImage: "/placeholder.svg?height=200&width=400",
    specialty: "Транспорт",
    location: "London, UK",
    joinedDate: "2024-02-01",
    bio: "Automotive 3D artist with a passion for creating photorealistic vehicle models. From classic cars to futuristic concepts.",
    website: null,
    isVerified: false,
    isFeatured: false,
    models: [
      {
        id: 6,
        title: "Sports Car",
        image: "/placeholder.svg?height=200&width=300",
        price: "$95",
      },
      {
        id: 7,
        title: "Vintage Motorcycle",
        image: "/placeholder.svg?height=200&width=300",
        price: "$58",
      },
    ],
    skills: ["Blender", "KeyShot", "Photoshop"],
  },
  {
    id: 4,
    name: "Sophia Kim",
    username: "sophiakim",
    avatar: "/placeholder.svg?height=120&width=120",
    coverImage: "/placeholder.svg?height=200&width=400",
    specialty: "Природа",
    location: "Seoul, South Korea",
    joinedDate: "2024-02-10",
    bio: "Environmental artist creating beautiful natural scenes and organic models. Bringing the beauty of nature into digital worlds.",
    website: "https://sophiakim.studio",
    isVerified: true,
    isFeatured: false,
    models: [
      {
        id: 8,
        title: "Ancient Tree",
        image: "/placeholder.svg?height=200&width=300",
        price: "$42",
      },
    ],
    skills: ["Blender", "SpeedTree", "World Creator"],
  },
  {
    id: 5,
    name: "David Rodriguez",
    username: "davidrod",
    avatar: "/placeholder.svg?height=120&width=120",
    coverImage: "/placeholder.svg?height=200&width=400",
    specialty: "Меблі",
    location: "Mexico City, Mexico",
    joinedDate: "2024-02-15",
    bio: "Interior designer and 3D artist creating modern furniture pieces. Focused on clean, minimalist designs for contemporary spaces.",
    website: null,
    isVerified: false,
    isFeatured: false,
    models: [
      {
        id: 9,
        title: "Modern Sofa",
        image: "/placeholder.svg?height=200&width=300",
        price: "$45",
      },
      {
        id: 10,
        title: "Office Chair",
        image: "/placeholder.svg?height=200&width=300",
        price: "$38",
      },
    ],
    skills: ["3ds Max", "V-Ray", "Rhino"],
  },
  {
    id: 6,
    name: "Emma Thompson",
    username: "emmathompson3d",
    avatar: "/placeholder.svg?height=120&width=120",
    coverImage: "/placeholder.svg?height=200&width=400",
    specialty: "Наукова фантастика",
    location: "Toronto, Canada",
    joinedDate: "2024-02-20",
    bio: "Concept artist and 3D modeler specializing in futuristic designs. Creating tomorrow's technology today.",
    website: "https://emmathompson3d.com",
    isVerified: true,
    isFeatured: true,
    models: [
      {
        id: 11,
        title: "Space Station",
        image: "/placeholder.svg?height=200&width=300",
        price: "$125",
      },
    ],
    skills: ["Blender", "Fusion 360", "Substance Suite"],
  },
];

export default function DesignersPage() {
  // const [searchTerm, setSearchTerm] = useState("");
  // const [selectedSpecialty, setSelectedSpecialty] = useState("Всі");
  // const [sortBy, setSortBy] = useState("featured");

  // const filteredArtists = artists.filter((artist) => {
  //   const matchesSearch =
  //     artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     artist.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     artist.bio.toLowerCase().includes(searchTerm.toLowerCase());

  //   const matchesSpecialty =
  //     selectedSpecialty === "Всі" || artist.specialty === selectedSpecialty;

  //   return matchesSearch && matchesSpecialty;
  // });

  // const sortedArtists = [...filteredArtists].sort((a, b) => {
  //   switch (sortBy) {
  //     case "featured":
  //       if (a.isFeatured && !b.isFeatured) return -1;
  //       if (!a.isFeatured && b.isFeatured) return 1;
  //       return (
  //         new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime()
  //       );
  //     case "newest":
  //       return (
  //         new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime()
  //       );
  //     case "name":
  //       return a.name.localeCompare(b.name);
  //     default:
  //       return 0;
  //   }
  // });

  // const featuredArtists = artists.filter((artist) => artist.isFeatured);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Featured Artists */}
        {/* <section className="bg-muted/30 py-12">
          <div className="container px-4 md:px-6">
            <div className="space-y-8">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Наші дизайнери
                </h1>
                <p className="text-muted-foreground">
                  Фокус на виняткових творцях в нашій спільноті
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {artists.map((artist) => (
                  <Card
                    key={artist.id}
                    className="group overflow-hidden transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="relative">
                      <img
                        src={artist.coverImage || "/placeholder.svg"}
                        alt={`${artist.name} cover`}
                        className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute -bottom-8 left-4">
                        <div className="relative">
                          <Avatar className="border-background h-16 w-16 border-4">
                            <AvatarImage
                              src={artist.avatar || "/placeholder.svg"}
                              alt={artist.name}
                            />
                            <AvatarFallback>
                              {artist.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {artist.isVerified && (
                            <div className="absolute -right-1 -bottom-1 rounded-full bg-blue-500 p-1">
                              <Verified className="h-3 w-3 fill-white text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-primary absolute top-2 right-2">
                        Популярний
                      </Badge>
                    </div>
                    <CardContent className="pt-12 pb-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold">
                            {artist.name}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            @{artist.username}
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            {artist.specialty}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-3 text-sm">
                          {artist.bio}
                        </p>
                        <div className="text-muted-foreground flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {artist.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Приєднався{" "}
                            {new Date(artist.joinedDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/artists/${artist.username}`}>
                              Переглянути профіль
                            </Link>
                          </Button>
                          {artist.website && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={artist.website}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section> */}

        {/* All Artists */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="space-y-8">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Всі дизайнери
                </h1>
                <p className="text-muted-foreground">
                  Перегляньте нашу повну спільноту 3D творців
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="flex w-full items-center gap-4 md:w-auto">
                  <div className="relative flex-1 md:w-80">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder="Пошук дизайнерів..."
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
                      <SelectItem value="featured">Популярні</SelectItem>
                      <SelectItem value="newest">Нові</SelectItem>
                      <SelectItem value="name">Ім&apos;я</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Specialty Filters */}
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty) => (
                  <Button
                    key={specialty.name}
                    variant={
                      // selectedSpecialty === specialty.name
                      // ? "default"
                      // : "outline"
                      "outline"
                    }
                    size="sm"
                    // onClick={() => setSelectedSpecialty(specialty.name)}
                    className="gap-2"
                  >
                    {specialty.icon}
                    {specialty.name}
                    <Badge variant="secondary" className="ml-1">
                      {specialty.count}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Artists Grid */}

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {artists.map((artist) => (
                  <Card
                    key={artist.id}
                    className="group overflow-hidden transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="relative">
                      <img
                        src={artist.coverImage || "/placeholder.svg"}
                        alt={`${artist.name} cover`}
                        className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute -bottom-6 left-4">
                        <div className="relative">
                          <Avatar className="border-background h-12 w-12 border-4">
                            <AvatarImage
                              src={artist.avatar || "/placeholder.svg"}
                              alt={artist.name}
                            />
                            <AvatarFallback>
                              {artist.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {artist.isVerified && (
                            <div className="absolute -right-1 -bottom-1 rounded-full bg-blue-500 p-1">
                              <Verified className="h-2 w-2 fill-white text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                      {artist.isFeatured && (
                        <Badge className="bg-primary absolute top-2 right-2">
                          Популярний
                        </Badge>
                      )}
                    </div>
                    <CardContent className="pt-8 pb-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold">{artist.name}</h3>
                          <p className="text-muted-foreground text-xs">
                            @{artist.username}
                          </p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {artist.specialty}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {artist.bio}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <Link href={`/artists/${artist.username}`}>
                            Переглянути профіль
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {artists.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Дизайнерів, що відповідають вашим критеріям, не знайдено.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Join CTA */}
        <section className="from-background bg-gradient-to-br to-purple-600 py-16 text-white">
          <div className="container px-4 text-center md:px-6">
            <div className="mx-auto max-w-3xl space-y-6">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Приєднуйтесь до нашої творчої спільноти
              </h2>
              <p className="text-xl opacity-90">
                Поділіться своїми 3D-роботами з усім світом і зв&apos;яжіться з
                іншими дизайнерами. Почніть свою подорож сьогодні.
              </p>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/register">Станьте дизайнером</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-primary"
                >
                  <Link href="/catalog">Переглянути каталог</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
