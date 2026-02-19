import { z } from "zod";

export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "errors.usernameRequired")
    .regex(/^[a-z0-9_]{3,20}$/, "errors.usernameInvalid"),
  email: z.string().min(1, "errors.emailRequired").email("errors.emailInvalid"),
  password: z.string().min(8, "errors.passwordMinLength"),
  terms: z
    .boolean()
    .refine((value) => value, { message: "errors.termsRequired" }),
});
