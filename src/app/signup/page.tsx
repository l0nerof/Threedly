"use client";

import Header from "@/business/components/Header";
import { signupSchema } from "@/business/schemas/signup";
import { SignupFormValues } from "@/business/types/signup";
import { Button } from "@/shared/components/Button";
import { Checkbox } from "@/shared/components/Checkbox";
import Footer from "@/shared/components/Footer";
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

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  // const router = useRouter();
  // const supabase: SupabaseClient = createClientComponentClient();

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
    console.log("Form submitted:", values);
    // TODO: Add Supabase authentication logic here
    // setLoading(true);
    // setError(null);
    // ... authentication logic
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container flex h-full items-center justify-center px-4 py-12 md:py-24">
          <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border bg-card p-4 shadow-sm md:p-6">
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

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                              {showPassword
                                ? "Приховати пароль"
                                : "Показати пароль"}
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
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
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
