import { createClient } from "@/business/utils/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Успішне підтвердження - перенаправляємо користувача
      redirect(next);
    } else {
      console.error("Email verification error:", error);
      // Помилка підтвердження - перенаправляємо на сторінку з помилкою
      redirect("/error?message=email-verification-failed");
    }
  }

  // Неправильні параметри - перенаправляємо на сторінку з помилкою
  redirect("/error?message=invalid-verification-link");
}
