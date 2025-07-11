"use client";

import { signup } from "@/app/signup/actions";
import { signupSchema } from "@/business/schemas/signup";
import { SignupFormValues } from "@/business/types/signup";
import { Button } from "@/shared/components/Button";
import { Checkbox } from "@/shared/components/Checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/Form";
import { Input } from "@/shared/components/Input";
import GoogleIcon from "@/shared/icons/Google";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      agreedToTerms: false,
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);

      await signup(formData);
      // Server Action автоматично зробить redirect, тому код нижче не виконається
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Сталася помилка при реєстрації",
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleSignUpWithGoogle = async () => {
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const { error } = await supabase.auth.signInWithOAuth({
  //       provider: "google",
  //       options: {
  //         redirectTo: `${window.location.origin}/auth/callback`,
  //       },
  //     });

  //     if (error) {
  //       setError(error.message);
  //     }
  //   } catch (err) {
  //     console.error("Google signup error:", err);
  //     setError("An unexpected error occurred. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-start gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ім&apos;я</FormLabel>
                  <FormControl>
                    <Input placeholder="Іван" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Прізвище</FormLabel>
                  <FormControl>
                    <Input placeholder="Іваненко" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пошта</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="ivan.ivanenko@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Приховати пароль" : "Показати пароль"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreedToTerms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer text-sm">
                    Я погоджуюся з{" "}
                    <Link
                      href="/terms"
                      className="underline underline-offset-2"
                    >
                      Умовами використання
                    </Link>{" "}
                    та{" "}
                    <Link
                      href="/privacy"
                      className="underline underline-offset-2"
                    >
                      Політикою конфіденційності
                    </Link>
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading || form.formState.isSubmitting}
          >
            {loading || form.formState.isSubmitting
              ? "Створюю обліковий запис..."
              : "Створити обліковий запис"}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Або зареєструватися з
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        // onClick={handleSignUpWithGoogle}
        // disabled={loading}
      >
        <GoogleIcon className="mr-2 size-4" />
        Google
      </Button>
    </>
  );
}

export default SignupForm;
