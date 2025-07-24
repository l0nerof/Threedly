import Header from "@/business/components/Header";
import LoginForm from "@/business/components/LoginForm";
import Footer from "@/shared/components/Footer";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="container flex h-full items-center justify-center px-4 py-12 md:py-24">
          <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border bg-card p-4 shadow-xs md:p-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold md:text-3xl">Вітаємо знову</h1>
              <p className="text-muted-foreground">
                Увійдіть до свого облікового запису, щоб продовжити
              </p>
            </div>

            {/* {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )} */}

            <LoginForm />

            <div className="text-center text-sm">
              Не маєте облікового запису?{" "}
              <Link href="/signup" className="text-primary underline">
                Зареєструватися
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
