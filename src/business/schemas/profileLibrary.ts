import { z } from "zod";
import { marketplacePlanKeys } from "../constants/plans";
import {
  PROFILE_LIBRARY_PAGE_SIZE,
  profileLibraryTabValues,
} from "../constants/profileConfig";
import type { CatalogModel } from "../types/catalog";
import type { Database } from "../types/database.generated";
import type { Designer } from "../types/designer";

const countSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const profileLibraryTabSchema = z.enum(profileLibraryTabValues);
const pageSchema = z.number().int().min(1).max(2_147_483_647);

export const profileLibraryRequestSchema = z.object({
  tab: profileLibraryTabSchema.catch("downloaded"),
  page: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(pageSchema)
    .catch(1),
});

const modelSchema = z.object({
  id: z.string().guid(),
  slug: z.string().min(1),
  title_ua: z.string(),
  title_en: z.string(),
  description_ua: z.string().nullable(),
  description_en: z.string().nullable(),
  cover_image_path: z.string().min(1),
  minimum_plan: z.enum(marketplacePlanKeys),
  file_format: z.string().nullable(),
  download_count: countSchema,
  is_featured: z.boolean(),
  published_at: z.iso.datetime({ offset: true }).nullable(),
}) satisfies z.ZodType<CatalogModel>;

const designerSchema = z.object({
  id: z.string().guid(),
  username: z.string().min(1),
  bio: z.string().nullable(),
  avatar_path: z.string().nullable(),
  plan_key: z.enum(marketplacePlanKeys),
  created_at: z.iso.datetime({ offset: true }),
  model_count: countSchema,
}) satisfies z.ZodType<Designer>;

type LibraryRow =
  Database["public"]["Functions"]["get_profile_library_page"]["Returns"][number];

export const profileLibraryPageSchema = z
  .object({
    profile_id: z.string().guid(),
    active_tab: profileLibraryTabSchema,
    current_page: pageSchema,
    total_pages: countSchema.min(1),
    downloaded_count: countSchema,
    favorite_count: countSchema,
    followed_count: countSchema,
    models: z.array(modelSchema).max(PROFILE_LIBRARY_PAGE_SIZE),
    designers: z.array(designerSchema).max(PROFILE_LIBRARY_PAGE_SIZE),
  } satisfies Record<keyof LibraryRow, z.ZodType>)
  .superRefine((data, ctx) => {
    const total =
      data.active_tab === "downloaded"
        ? data.downloaded_count
        : data.active_tab === "favoriteModels"
          ? data.favorite_count
          : data.followed_count;
    const pages = Math.max(1, Math.ceil(total / PROFILE_LIBRARY_PAGE_SIZE));
    const items =
      data.active_tab === "subscriptions" ? data.designers : data.models;
    const expectedLength = Math.min(
      PROFILE_LIBRARY_PAGE_SIZE,
      total - (data.current_page - 1) * PROFILE_LIBRARY_PAGE_SIZE,
    );
    if (
      data.total_pages !== pages ||
      data.current_page > pages ||
      items.length !== expectedLength ||
      new Set(items.map((item) => item.id)).size !== items.length ||
      (data.active_tab === "subscriptions"
        ? data.models.length > 0
        : data.designers.length > 0)
    ) {
      ctx.addIssue({ code: "custom", message: "Inconsistent library page" });
    }
  });
