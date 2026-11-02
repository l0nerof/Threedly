"use server";

import { publicationIdSchema } from "@/src/business/schemas/modelPublication";
import type { PublicationResult } from "@/src/business/types/modelPublication";
import type { PublicationPreviewAuthor } from "@/src/business/types/modelPublicationPreview";
import { awaitPublicationRequest } from "@/src/business/utils/modelPublication";
import {
  publicationPreviewAuthor,
  publicationPreviewAuthorSchema,
} from "@/src/business/utils/modelPublicationPreview";
import { withPublicationClient } from "@/src/business/utils/supabase/modelPublicationFiles";
import { resolveAvatarPublicUrl } from "@/src/business/utils/supabase/storage";
import { z } from "zod";

const requestSchema = z.object({ ownerId: publicationIdSchema }).strict();

export async function fetchPublicationPreviewAuthorAction(
  input: unknown,
): Promise<PublicationResult<PublicationPreviewAuthor>> {
  const request = requestSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withPublicationClient(async (context) => {
    if (request.data.ownerId !== context.userId)
      return { ok: false, error: "session_changed" };
    const response = await awaitPublicationRequest(
      context.client
        .from("profiles")
        .select("id,username,avatar_path")
        .eq("id", context.userId)
        .abortSignal(context.signal)
        .maybeSingle(),
      context.signal,
    );
    if (response.error) return { ok: false, error: "generic" };
    const profile = publicationPreviewAuthorSchema.safeParse(response.data);
    if (!profile.success || profile.data.id !== context.userId)
      return { ok: false, error: "generic" };
    const author = publicationPreviewAuthor(
      {
        ok: true,
        data: {
          ...profile.data,
          avatar_path: resolveAvatarPublicUrl(profile.data.avatar_path),
        },
      },
      context.userId,
    );
    return { ok: true, data: author };
  });
}
