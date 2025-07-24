import Header from "@/business/components/Header";
import SignupForm from "@/business/components/SignupForm";
import Footer from "@/shared/components/Footer";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container flex h-full items-center justify-center px-4 py-12 md:py-24">
          <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border bg-card p-4 shadow-xs md:p-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold md:text-3xl">
                Створити обліковий запис
              </h1>
              <p className="text-muted-foreground">
                Введіть свою інформацію для початку роботи
              </p>
            </div>

            {/* {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
                )} */}

            <SignupForm />

            <div className="text-center text-sm">
              Вже маєте обліковий запис?{" "}
              <Link href="/login" className="text-primary underline">
                Увійти
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
