import Header from "@/business/components/Header";
import { Button } from "@/shared/components/Button";
import Footer from "@/shared/components/Footer";
import { CheckCircle, Mail } from "lucide-react";
import Link from "next/link";

// import { useSearchParams } from "next/navigation";

// import { useState } from "react";
// import { resendVerificationEmail } from "./actions";

interface VerifyEmailPageProps {
  searchParams: Promise<{ email: string }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { email } = await searchParams;

  //   const searchParams = await useSearchParams();
  //   const email = searchParams.get("email");
  //   const [isResending, setIsResending] = useState(false);
  //   const [resendMessage, setResendMessage] = useState<string | null>(null);

  //   const handleResendEmail = async () => {
  //     if (!email) {
  //       setResendMessage("Не вдалося знайти email адресу");
  //       return;
  //     }

  //     setIsResending(true);
  //     setResendMessage(null);

  //     try {
  //       await resendVerificationEmail(email);
  //       setResendMessage("Лист підтвердження надіслано повторно!");
  //     } catch (error) {
  //       setResendMessage(
  //         error instanceof Error ? error.message : "Помилка при надсиланні листа",
  //       );
  //     } finally {
  //       setIsResending(false);
  //     }
  //   };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="container flex h-full items-center justify-center px-4 py-12 md:py-24">
          <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border bg-card p-4 shadow-sm md:p-6">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>

              <h1 className="text-2xl font-bold md:text-3xl">
                Підтвердіть свою електронну пошту
              </h1>

              <p className="text-muted-foreground">
                Ми надіслали посилання для підтвердження на вашу електронну
                адресу
                {email && (
                  <span className="mt-1 block font-medium text-foreground">
                    {email}
                  </span>
                )}
                . Будь ласка, перевірте свою пошту та натисніть на посилання для
                завершення реєстрації.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Що робити далі:</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>1. Перевірте свою поштову скриньку</li>
                      <li>2. Знайдіть лист від Threedly</li>
                      <li>3. Натисніть на посилання для підтвердження</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Не отримали листа?
                </p>
                {email && (
                  <Button
                    variant="outline"
                    size="sm"
                    // onClick={handleResendEmail}
                    // disabled={isResending}
                  >
                    {/* {isResending ? "Надсилаю..." : */}
                    Надіслати повторно
                    {/* } */}
                  </Button>
                )}
                {/* {resendMessage && (
                  <p
                    className={`text-sm ${resendMessage.includes("надіслано") ? "text-green-600" : "text-red-600"}`}
                  >
                    {resendMessage}
                  </p>
                )} */}
              </div>
            </div>

            <div className="text-center">
              <Button variant="ghost" asChild>
                <Link href="/login">Повернутися до входу</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
