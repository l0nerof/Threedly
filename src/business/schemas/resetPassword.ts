import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "errors.passwordMinLength"),
    confirmPassword: z.string().min(1, "errors.confirmPasswordRequired"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "errors.passwordMismatch",
    path: ["confirmPassword"],
  });
