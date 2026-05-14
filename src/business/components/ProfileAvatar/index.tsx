import { UserIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "../../../shared/utils/cn";
import { resolveAvatarPublicUrl } from "../../utils/supabase/storage";

type ProfileAvatarProps = {
  alt?: string;
  avatarPath?: string | null;
  className?: string;
  iconClassName?: string;
  sizes?: string;
};

function ProfileAvatar({
  alt = "",
  avatarPath,
  className,
  iconClassName,
  sizes = "80px",
}: ProfileAvatarProps) {
  const avatarPublicUrl = resolveAvatarPublicUrl(avatarPath);

  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
    >
      {avatarPublicUrl ? (
        <Image
          src={avatarPublicUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
        />
      ) : (
        <UserIcon className={cn("size-8", iconClassName)} />
      )}
    </div>
  );
}

export { ProfileAvatar };
