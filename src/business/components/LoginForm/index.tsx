"use client";

import { login } from "@/app/login/actions";
import { loginSchema } from "@/business/schemas/login";
import { LoginFormValues } from "@/business/types/login";
import { Button } from "@/shared/components/Button";
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

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);

      await login(formData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Сталася помилка при вході",
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already logged in
  // useEffect(() => {
  //   const checkUser = async () => {
  //     const { data } = await supabase.auth.getSession();
  //     if (data.session) {
  //       setUser(data.session.user);
  //       router.push("/");
  //     }
  //   };
  //   checkUser();
  // }, [supabase, router]);

  // const handleSignInWithGoogle = async () => {
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
  //       console.error("Google sign in error:", error);
  //       setError(error.message);
  //     }
  //   } catch (err) {
  //     console.error("Unexpected error during Google sign in:", err);
  //     setError("An unexpected error occurred. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пошта</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
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
                <div className="flex items-center justify-between">
                  <FormLabel>Пароль</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Забули пароль?
                  </Link>
                </div>
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

          <Button
            type="submit"
            className="w-full"
            disabled={loading || form.formState.isSubmitting}
          >
            {loading || form.formState.isSubmitting ? "Входжу..." : "Увійти"}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Або увійти з
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        // onClick={handleSignInWithGoogle}
        // disabled={loading}
      >
        <GoogleIcon className="mr-2 size-4" />
        Google
      </Button>
    </>
  );
}

export default LoginForm;
