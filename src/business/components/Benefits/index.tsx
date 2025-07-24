import { Card, CardContent } from "@/shared/components/Card";
import { Palette, Shield, Users } from "lucide-react";
import React from "react";

const platformBenefits = [
  {
    icon: <Shield className="size-8" />,
    title: "Якість на першому місці",
    description:
      "Кожна модель ретельно перевіряється для забезпечення високих стандартів та технічного досконалості.",
    color: "bg-linear-to-br from-blue-500 to-blue-600",
  },
  {
    icon: <Users className="size-8" />,
    title: "Зростаюча спільнота",
    description:
      "Приєднуйтесь до нашої патріотичної спільноти 3D-дизайнерів та творців з усього світу.",
    color: "bg-linear-to-br from-green-500 to-green-600",
  },
  {
    icon: <Palette className="size-8" />,
    title: "Дизайнери на першому місці",
    description:
      "Створено для дизайнерів. Ми розуміємо, що дизайнерам потрібно для успіху.",
    color: "bg-linear-to-br from-purple-500 to-purple-600",
  },
];

function Benefits() {
  return (
    <section className="w-full bg-muted/30 py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="mb-12 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Чому вибрати Threedly?
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Ми створюємо щось особливе для 3D-спільноти
            </p>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {platformBenefits.map((benefit, index) => (
            <Card
              key={index}
              className="group border-0 shadow-xs shadow-black/10 transition-all duration-300 hover:shadow-lg dark:shadow-white/10"
            >
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div
                    className={`mx-auto h-16 w-16 rounded-full ${benefit.color} flex items-center justify-center text-white transition-transform group-hover:scale-110`}
                  >
                    {benefit.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{benefit.title}</h3>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
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

export default Benefits;
