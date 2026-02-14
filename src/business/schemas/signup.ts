import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().min(1, "errors.emailRequired").email("errors.emailInvalid"),
  password: z.string().min(8, "errors.passwordMinLength"),
  terms: z
    .boolean()
    .refine((value) => value, { message: "errors.termsRequired" }),
});
