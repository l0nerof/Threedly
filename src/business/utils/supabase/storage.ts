export const AVATARS_BUCKET = "avatars";
const AVATAR_OBJECT_NAME = "avatar";

export function buildAvatarStoragePath(userId: string): string {
  return `${userId}/${AVATAR_OBJECT_NAME}`;
}

export function resolveAvatarPublicUrl(
  avatarPath?: string | null,
): string | null {
  if (!avatarPath) {
    return null;
  }

  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return avatarPath;
  }

  return `${supabaseUrl}/storage/v1/object/public/${AVATARS_BUCKET}/${avatarPath}`;
}
