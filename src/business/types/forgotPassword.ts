import type { z } from "zod";
import { forgotPasswordSchema } from "../schemas/forgotPassword";

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
