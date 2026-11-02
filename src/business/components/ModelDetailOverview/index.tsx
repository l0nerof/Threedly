import type { CatalogModel } from "@/src/business/types/catalog";
import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  description: string | null;
  creator: CatalogModel["creator"];
  aboutTitle: string;
  aboutEmpty: string;
  designerTitle: string;
  creatorAction?: ReactNode;
  creatorFallback?: ReactNode;
};

export default function ModelDetailOverview({
  description,
  creator,
  aboutTitle,
  aboutEmpty,
  designerTitle,
  creatorAction,
  creatorFallback,
}: Props) {
  return (
    <div className="grid items-start gap-8 p-6 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-[10px]">
        <h2 className="text-lg font-semibold">{aboutTitle}</h2>
        {description ? (
          <div className="text-muted-foreground flex flex-col gap-3 text-sm leading-relaxed">
            {description.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{aboutEmpty}</p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{designerTitle}</h2>
        {creator ? (
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
              {creator.avatar_path ? (
                <Image
                  src={creator.avatar_path}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <span className="text-xs font-semibold">
                  {creator.username.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">
                @{creator.username}
              </span>
              {creatorAction}
            </div>
          </div>
        ) : (
          creatorFallback
        )}
      </div>
    </div>
  );
}
