import type { z } from "zod";
import type { favoritesErrorCodes } from "../constants/favorites";
import type {
  designerFollowInputSchema,
  modelFavoriteInputSchema,
} from "../schemas/favorites";

export type FavoritesErrorCode = (typeof favoritesErrorCodes)[number];
export type SetModelFavoriteArgs = z.infer<typeof modelFavoriteInputSchema>;
export type SetDesignerFollowArgs = z.infer<typeof designerFollowInputSchema>;
export type FavoriteResourceKind = "model" | "designer";
export type FavoriteMutation = {
  userId: SetModelFavoriteArgs["userId"];
  targetId: SetModelFavoriteArgs["modelId"];
  selected: boolean;
  revision: number;
};
