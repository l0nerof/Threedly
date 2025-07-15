"use client";

import { Button } from "@/shared/components/Button";
import { AlertCircle, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const getErrorContent = () => {
    switch (message) {
      case "email-verification-failed":
        return {
          icon: <Mail className="h-8 w-8 text-red-500" />,
          title: "Помилка підтвердження email",
          description:
            "Не вдалося підтвердити вашу електронну адресу. Можливо, посилання застаріло або недійсне.",
          actions: (
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/signup">Зареєструватися знову</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Увійти</Link>
              </Button>
            </div>
          ),
        };
      case "invalid-verification-link":
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          title: "Недійсне посилання",
          description:
            "Посилання для підтвердження недійсне або пошкоджене. Будь ласка, спробуйте зареєструватися знову.",
          actions: (
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/signup">Зареєструватися знову</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Увійти</Link>
              </Button>
            </div>
          ),
        };
      default:
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          title: "Сталася помилка",
          description:
            "Вибачте, сталася непередбачена помилка. Будь ласка, спробуйте ще раз.",
          actions: (
            <div className="flex gap-3">
              <Button onClick={() => reset()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Оновити сторінку
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">На головну</Link>
              </Button>
            </div>
          ),
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="container flex h-full items-center justify-center px-4 py-12 md:py-24">
          <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border bg-card p-4 shadow-sm md:p-6">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                {errorContent.icon}
              </div>

              <h1 className="text-2xl font-bold md:text-3xl">
                {errorContent.title}
              </h1>

              <p className="text-muted-foreground">
                {errorContent.description}
              </p>
            </div>

            <div className="flex justify-center">{errorContent.actions}</div>
          </div>
        </section>
      </main>
      =
    </div>
  );
}

export default ErrorPage;
