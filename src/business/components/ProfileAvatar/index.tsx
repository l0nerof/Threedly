import { UserIcon } from "lucide-react";
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
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
    >
      {avatarPath ? (
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${avatarPath})` }}
        />
      ) : (
        <UserIcon className={cn("size-8", iconClassName)} />
      )}
    </div>
  );
}

export { ProfileAvatar };
