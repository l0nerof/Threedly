"use client";

import { useFavoriteModel } from "@/src/business/hooks/useFavorites";
import { Button } from "@/src/shared/components/Button";
import { cn } from "@/src/shared/utils/cn";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MouseEvent } from "react";

type FavoriteModelButtonProps = {
  className?: string;
  modelId: string;
};

function FavoriteModelButton({ className, modelId }: FavoriteModelButtonProps) {
  const t = useTranslations("Catalog.resultsArea.modelCard");
  const { isAuthenticated, isFavorite, isPending, toggle } =
    useFavoriteModel(modelId);

  if (!isAuthenticated) {
    return null;
  }

  const label = isFavorite ? t("removeFavoriteButton") : t("favoriteButton");

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggle();
  };

  return (
    <Button
      aria-label={label}
      aria-pressed={isFavorite}
      disabled={isPending}
      onClick={handleClick}
      variant="ghost"
      size="icon-sm"
      className={cn(
        "rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white",
        isFavorite && "bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      <Heart className={cn("size-4", isFavorite && "fill-current")} />
    </Button>
  );
}

export default FavoriteModelButton;
