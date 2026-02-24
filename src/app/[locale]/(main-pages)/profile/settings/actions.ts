"use server";

import { LocaleCode } from "@/src/business/constants/localization";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";
import { AVATARS_BUCKET } from "@/src/business/utils/supabase/storage";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOutAction(locale: string) {
  if (!isLocaleCode(locale)) {
    redirect(`/${LocaleCode.Ukrainian}/login`);
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect(`/${locale}/login`);
}

export type UpdateProfileActionResult = {
  ok: boolean;
  error?: "invalidLocale" | "usernameRequired" | "unauthorized" | "generic";
};

export type AvatarActionResult = {
  ok: boolean;
  avatarPath?: string | null;
  error?:
    | "invalidLocale"
    | "invalidFile"
    | "fileTooLarge"
    | "unsupportedFileType"
    | "unauthorized"
    | "generic";
};

const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getAvatarFileExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

function normalizeAvatarStoragePath(
  avatarPath: string | null | undefined,
): string | null {
  if (!avatarPath) {
    return null;
  }

  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    const marker = "/storage/v1/object/public/avatars/";
    const markerIndex = avatarPath.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    return avatarPath.slice(markerIndex + marker.length);
  }

  return avatarPath;
}

export async function updateProfileAction(
  locale: string,
  formData: FormData,
): Promise<UpdateProfileActionResult> {
  if (!isLocaleCode(locale)) {
    return { ok: false, error: "invalidLocale" };
  }

  const usernameValue = formData.get("username");
  const bioValue = formData.get("bio");

  const username =
    typeof usernameValue === "string" ? usernameValue.trim().toLowerCase() : "";
  const bio = typeof bioValue === "string" ? bioValue.trim() : "";

  if (!username) {
    return { ok: false, error: "usernameRequired" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      bio,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: "generic" };
  }

  revalidatePath(`/${locale}/profile/settings`);
  return { ok: true };
}

export async function uploadAvatarAction(
  locale: string,
  formData: FormData,
): Promise<AvatarActionResult> {
  if (!isLocaleCode(locale)) {
    return { ok: false, error: "invalidLocale" };
  }

  const avatarValue = formData.get("avatar");
  if (!avatarValue || typeof avatarValue === "string") {
    return { ok: false, error: "invalidFile" };
  }
  const avatarFile = avatarValue;

  if (avatarFile.size === 0) {
    return { ok: false, error: "invalidFile" };
  }

  if (avatarFile.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    return { ok: false, error: "fileTooLarge" };
  }

  if (!ALLOWED_AVATAR_MIME_TYPES.has(avatarFile.type)) {
    return { ok: false, error: "unsupportedFileType" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    console.error(
      "[uploadAvatarAction] load existing profile error",
      existingProfileError,
    );
    return { ok: false, error: "generic" };
  }

  const oldAvatarStoragePath = normalizeAvatarStoragePath(
    existingProfile?.avatar_path ?? null,
  );
  const fileExtension = getAvatarFileExtension(avatarFile.type);
  const storagePath = `${user.id}/avatar-${Date.now()}.${fileExtension}`;
  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(storagePath, avatarFile, {
      upsert: false,
      contentType: avatarFile.type,
      cacheControl: "31536000",
    });

  if (uploadError) {
    console.error("[uploadAvatarAction] storage upload error", uploadError);
    return { ok: false, error: "generic" };
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      avatar_path: storagePath,
    })
    .eq("id", user.id);

  if (profileUpdateError) {
    console.error(
      "[uploadAvatarAction] profile update error",
      profileUpdateError,
    );
    return { ok: false, error: "generic" };
  }

  if (oldAvatarStoragePath && oldAvatarStoragePath !== storagePath) {
    const { error: removeOldAvatarError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .remove([oldAvatarStoragePath]);
    if (removeOldAvatarError) {
      console.error(
        "[uploadAvatarAction] remove previous avatar error",
        removeOldAvatarError,
      );
    }
  }

  revalidatePath(`/${locale}/profile/settings`);
  return { ok: true, avatarPath: storagePath };
}

export async function removeAvatarAction(
  locale: string,
): Promise<AvatarActionResult> {
  if (!isLocaleCode(locale)) {
    return { ok: false, error: "invalidLocale" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    console.error(
      "[removeAvatarAction] load existing profile error",
      existingProfileError,
    );
    return { ok: false, error: "generic" };
  }

  const storagePath = normalizeAvatarStoragePath(
    existingProfile?.avatar_path ?? null,
  );
  if (storagePath) {
    const { error: removeError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .remove([storagePath]);

    if (removeError) {
      console.error("[removeAvatarAction] storage remove error", removeError);
      return { ok: false, error: "generic" };
    }
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      avatar_path: null,
    })
    .eq("id", user.id);

  if (profileUpdateError) {
    console.error(
      "[removeAvatarAction] profile update error",
      profileUpdateError,
    );
    return { ok: false, error: "generic" };
  }

  revalidatePath(`/${locale}/profile/settings`);
  return { ok: true, avatarPath: null };
}
