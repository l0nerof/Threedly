import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import { FAVORITES_BATCH_SIZE } from "../constants/favorites";
import type { Tables } from "../types/database.generated";

export const favoriteIdSchema = z
  .string()
  .guid()
  .transform((id) => id.toLowerCase());
export const favoriteUserSchema = z.object({
  id: favoriteIdSchema,
}) satisfies z.ZodType<Pick<User, "id">>;
export const favoriteRowsSchema = z
  .array(
    z.object({ model_id: favoriteIdSchema }) satisfies z.ZodType<
      Pick<Tables<"favorites">, "model_id">
    >,
  )
  .max(FAVORITES_BATCH_SIZE);
export const followRowsSchema = z
  .array(
    z.object({ designer_id: favoriteIdSchema }) satisfies z.ZodType<
      Pick<Tables<"designer_follows">, "designer_id">
    >,
  )
  .max(FAVORITES_BATCH_SIZE);

export const modelFavoriteInputSchema = z
  .object({
    isFavorite: z.boolean(),
    modelId: favoriteIdSchema,
    userId: favoriteIdSchema,
  })
  .strict();
export const designerFollowInputSchema = z
  .object({
    isFollowing: z.boolean(),
    designerId: favoriteIdSchema,
    userId: favoriteIdSchema,
  })
  .strict()
  .refine((input) => input.designerId !== input.userId);
