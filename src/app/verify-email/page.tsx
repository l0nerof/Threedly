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
          <div className="flex max-w-md flex-col items-center gap-6 rounded-lg border bg-card p-4 shadow-xs md:p-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="size-6 text-primary" />
            </div>

            <h1 className="text-center text-2xl font-bold md:text-3xl">
              Підтвердіть свою електронну пошту
            </h1>

            <p className="text-center text-muted-foreground">
              Ми надіслали посилання для підтвердження на вашу електронну адресу{" "}
              {email && (
                <span className="font-medium text-foreground">{email}</span>
              )}
              . Будь ласка, перевірте свою пошту та натисніть на посилання для
              завершення реєстрації.
            </p>

            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="size-5 text-green-500" />
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium">Що робити далі:</p>
                  <ul className="flex list-decimal flex-col gap-1 text-sm text-muted-foreground">
                    <li>Перевірте свою поштову скриньку</li>
                    <li>Знайдіть лист від Threedly</li>
                    <li>Натисніть на посилання для підтвердження</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Не отримали листа?
              </p>
              <div className="flex flex-col items-center gap-2">
                {email && (
                  <Button
                    variant="outline"
                    className="w-full"
                    // onClick={handleResendEmail}
                    // disabled={isResending}
                  >
                    {/* {isResending ? "Надсилаю..." : */}
                    Надіслати повторно
                    {/* } */}
                  </Button>
                )}

                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">Повернутися до входу</Link>
                </Button>
              </div>
              {/* {resendMessage && (
                  <p
                    className={`text-sm ${resendMessage.includes("надіслано") ? "text-green-600" : "text-red-600"}`}
                  >
                    {resendMessage}
                  </p>
                )} */}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
