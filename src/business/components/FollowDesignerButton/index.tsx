"use client";

import { useFollowDesigner } from "@/src/business/hooks/useFavorites";
import { Button } from "@/src/shared/components/Button";
import { cn } from "@/src/shared/utils/cn";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MouseEvent } from "react";

type FollowDesignerButtonProps = {
  className?: string;
  designerId: string;
};

function FollowDesignerButton({
  className,
  designerId,
}: FollowDesignerButtonProps) {
  const t = useTranslations("Designers.card");
  const { isAuthenticated, isFollowing, isPending, toggle } =
    useFollowDesigner(designerId);

  if (!isAuthenticated) {
    return null;
  }

  const label = isFollowing ? t("unfollowButton") : t("followButton");

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggle();
  };

  return (
    <Button
      aria-label={label}
      aria-pressed={isFollowing}
      disabled={isPending}
      onClick={handleClick}
      variant="ghost"
      size="icon-sm"
      className={cn(
        "rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white",
        isFollowing && "bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      <Heart className={cn("size-4", isFollowing && "fill-current")} />
    </Button>
  );
}

export default FollowDesignerButton;
