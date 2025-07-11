import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Поле email є обов'язковим")
    .email("Введіть коректну адресу електронної пошти"),
  password: z
    .string()
    .min(6, "Пароль повинен містити щонайменше 6 символів")
    .max(50, "Пароль не може перевищувати 50 символів"),
});
