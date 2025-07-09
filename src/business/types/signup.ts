import z from "zod";
import { signupSchema } from "../schemas/signup";

export type SignupFormValues = z.infer<typeof signupSchema>;
