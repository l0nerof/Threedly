import type { z } from "zod";
import { resetPasswordSchema } from "../schemas/resetPassword";

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
