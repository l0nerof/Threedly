import { UserIcon } from "lucide-react";
import { resolveAvatarPublicUrl } from "../../utils/supabase/storage";
import { cn } from "../../../shared/utils/cn";

type ProfileAvatarProps = {
  avatarPath?: string | null;
  className?: string;
  iconClassName?: string;
};

function ProfileAvatar({
  avatarPath,
  className,
  iconClassName,
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
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${avatarPublicUrl})` }}
        />
      ) : (
        <UserIcon className={cn("size-8", iconClassName)} />
      )}
    </div>
  );
}

export { ProfileAvatar };
