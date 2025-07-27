// import CatalogGrid from "@/business/components/CatalogGrid";
import Header from "@/business/components/Header";
import { Button } from "@/shared/components/Button";
import { Checkbox } from "@/shared/components/Checkbox";
import Footer from "@/shared/components/Footer";
import { Input } from "@/shared/components/Input";
import { Label } from "@/shared/components/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/Select";
import { Separator } from "@/shared/components/Separator";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/Sheet";
import { Slider } from "@/shared/components/Slider";
import { Filter, Search, SlidersHorizontal } from "lucide-react";

export default function CatalogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container px-4 py-6 md:px-6 md:py-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold md:text-3xl">
                Каталог 3D моделей
              </h1>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Фільтри
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="grid gap-6 py-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Категорії</h3>
                      <div className="space-y-2">
                        {[
                          "Архітектура",
                          "Меблі",
                          "Персонажі",
                          "Транспорт",
                          "Природа",
                          "Абстракція",
                          "Наукова фантастика",
                          "Мода",
                        ].map((category) => (
                          <div
                            key={category}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`category-${category.toLowerCase()}`}
                            />
                            <Label
                              htmlFor={`category-${category.toLowerCase()}`}
                            >
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Діапазон цін</h3>
                      <div className="space-y-4">
                        <Slider defaultValue={[0, 100]} max={200} step={1} />
                        <div className="flex items-center justify-between">
                          <span className="text-sm">$0</span>
                          <span className="text-sm">$200+</span>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Формат файлу</h3>
                      <div className="space-y-2">
                        {["OBJ", "FBX", "GLTF", "STL", "BLEND"].map(
                          (format) => (
                            <div
                              key={format}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox id={`format-${format.toLowerCase()}`} />
                              <Label htmlFor={`format-${format.toLowerCase()}`}>
                                {format}
                              </Label>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Ліцензія</h3>
                      <div className="space-y-2">
                        {[
                          "Стандартна",
                          "Розширена",
                          "Комерційна",
                          "Редакційна",
                        ].map((license) => (
                          <div
                            key={license}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox id={`license-${license.toLowerCase()}`} />
                            <Label htmlFor={`license-${license.toLowerCase()}`}>
                              {license}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button className="mt-4">Застосувати фільтри</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="hidden w-[240px] flex-shrink-0 lg:block">
                <div className="sticky top-24 grid gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <h3 className="font-medium">Фільтри</h3>
                    </div>
                    <Separator />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Категорії</h3>
                    <div className="space-y-2">
                      {[
                        "Архітектура",
                        "Меблі",
                        "Персонажі",
                        "Транспорт",
                        "Природа",
                        "Абстракція",
                        "Наукова фантастика",
                        "Мода",
                      ].map((category) => (
                        <div
                          key={category}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`desktop-category-${category.toLowerCase()}`}
                          />
                          <Label
                            htmlFor={`desktop-category-${category.toLowerCase()}`}
                          >
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Діапазон цін</h3>
                    <div className="space-y-4">
                      <Slider defaultValue={[0, 100]} max={200} step={1} />
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$0</span>
                        <span className="text-sm">$200+</span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Формат файлу</h3>
                    <div className="space-y-2">
                      {["OBJ", "FBX", "GLTF", "STL", "BLEND"].map((format) => (
                        <div
                          key={format}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`desktop-format-${format.toLowerCase()}`}
                          />
                          <Label
                            htmlFor={`desktop-format-${format.toLowerCase()}`}
                          >
                            {format}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Ліцензія</h3>
                    <div className="space-y-2">
                      {[
                        "Стандартна",
                        "Розширена",
                        "Комерційна",
                        "Редакційна",
                      ].map((license) => (
                        <div
                          key={license}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`desktop-license-${license.toLowerCase()}`}
                          />
                          <Label
                            htmlFor={`desktop-license-${license.toLowerCase()}`}
                          >
                            {license}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button>Застосувати фільтри</Button>
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Пошук в каталозі..."
                      className="max-w-xs"
                    />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                      <span className="sr-only">Пошук</span>
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="newest">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Сортувати за" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Нові</SelectItem>
                        <SelectItem value="popular">Найпопулярніші</SelectItem>
                        <SelectItem value="price-low">
                          Ціна: від низької до високої
                        </SelectItem>
                        <SelectItem value="price-high">
                          Ціна: від високої до низької
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* <CatalogGrid /> */}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
