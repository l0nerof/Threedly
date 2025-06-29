import Header from "@/business/components/Header";
import { Button } from "@/shared/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/Card";
import Footer from "@/shared/components/Footer";
import { Check } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <>
      <Header />
      <main>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Простота і прозорість
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Оберіть найкращий план для ваших потреб. Без прихованих
                  комісій.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-3">
              <Card className="justify-between">
                <CardHeader className="flex flex-col items-center justify-center space-y-2">
                  <CardTitle className="text-xl">Безкоштовно</CardTitle>
                  <CardDescription>Для хобістів і новачків</CardDescription>
                  <div className="flex items-baseline text-center">
                    <span className="text-3xl font-bold">$0</span>
                    <span className="ml-1 text-muted-foreground">/місяць</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                  <ul className="space-y-2 text-left">
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>5 завантажень на місяць</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Доступ лише до безкоштовних моделей</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Базова ліцензія</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Підтримка спільноти</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/checkout?plan=free">Почати</Link>
                  </Button>
                </CardFooter>
              </Card>
              <Card className="relative justify-between border-primary">
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Популярний
                </div>
                <CardHeader className="flex flex-col items-center justify-center space-y-2">
                  <CardTitle className="text-xl">Про</CardTitle>
                  <CardDescription>Для професіоналів</CardDescription>
                  <div className="flex items-baseline text-center">
                    <span className="text-3xl font-bold">$29</span>
                    <span className="ml-1 text-muted-foreground">/місяць</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                  <ul className="space-y-2 text-left">
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>50 завантажень на місяць</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Доступ до всіх моделей</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Комерційна ліцензія</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Пріоритетна підтримка</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Налаштування моделі</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/checkout?plan=pro">Підписатися</Link>
                  </Button>
                </CardFooter>
              </Card>
              <Card className="justify-between">
                <CardHeader className="flex flex-col items-center justify-center space-y-2">
                  <CardTitle className="text-xl">Корпоративний</CardTitle>
                  <CardDescription>Для команд і бізнесів</CardDescription>
                  <div className="flex items-baseline text-center">
                    <span className="text-3xl font-bold">$99</span>
                    <span className="ml-1 text-muted-foreground">/місяць</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                  <ul className="space-y-2 text-left">
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Необмежені завантаження</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Доступ до всіх моделей</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Розширена комерційна ліцензія</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Віддалена підтримка</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Запити на налаштування моделі</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>Інструменти для командної роботи</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/checkout?plan=enterprise">
                      Зв&apos;язатися з продажами
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold">Часті запитання</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="text-left">
                  <h3 className="font-bold">Чи можу я змінити план?</h3>
                  <p className="mt-1 text-muted-foreground">
                    Так, ви можете змінити план в будь-який момент. Зміни
                    вступають в силу на початку наступного рахункового циклу.
                  </p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold">Які методи оплати ви приймаєте?</h3>
                  <p className="mt-1 text-muted-foreground">
                    Ми приймаємо всі основні кредитні картки, PayPal та
                    банківські перекази для річних планів.
                  </p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold">Чи можна повернути кошти?</h3>
                  <p className="mt-1 text-muted-foreground">
                    Ми пропонуємо 14-денну гарантію повернення коштів для всіх
                    платних планів.
                  </p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold">
                    Що станеться, якщо я досягну обмеження завантажень?
                  </h3>
                  <p className="mt-1 text-muted-foreground">
                    Ви можете підвищити план або почекати, поки обмеження знову
                    вступить в силу на початку наступного рахункового циклу.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
