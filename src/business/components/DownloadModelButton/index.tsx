"use client";

import { downloadModelAction } from "@/src/app/[locale]/(main-pages)/catalog/download-actions";
import {
  modelDownloadErrorKeys,
  modelDownloadQueryKeys,
} from "@/src/business/constants/modelDownload";
import { Button } from "@/src/shared/components/Button";
import { cn } from "@/src/shared/utils/cn";
import { useQueryClient } from "@tanstack/react-query";
import { Download, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { toast } from "sonner";

type DownloadModelButtonProps = {
  modelId: string;
  fileId?: string;
  fileName?: string;
  className?: string;
  compact?: boolean;
};

function DownloadModelButton({
  modelId,
  fileId,
  fileName,
  className,
  compact = false,
}: DownloadModelButtonProps) {
  const t = useTranslations("Downloads");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const requestInFlight = useRef(false);

  function handleDownload() {
    if (requestInFlight.current) return;
    requestInFlight.current = true;

    startTransition(async () => {
      try {
        const result = await downloadModelAction({
          modelId,
          ...(fileId ? { fileId } : {}),
        });

        if (!result.ok) {
          toast.error(t(`errors.${modelDownloadErrorKeys[result.error]}`));
          return;
        }

        const link = document.createElement("a");
        link.href = result.url;
        link.download = "";
        document.body.appendChild(link);
        try {
          link.click();
        } finally {
          link.remove();
        }

        for (const queryKey of modelDownloadQueryKeys) {
          void queryClient.invalidateQueries({ queryKey });
        }
        router.refresh();
      } catch {
        toast.error(t("errors.generic"));
      } finally {
        requestInFlight.current = false;
      }
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      className={cn("rounded-xl", className)}
      disabled={isPending}
      aria-busy={isPending}
      aria-label={
        isPending
          ? t("pending")
          : fileName
            ? t("downloadFile", { name: fileName })
            : t("button")
      }
      onClick={handleDownload}
    >
      {isPending ? (
        <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />
      ) : (
        <Download className="size-4" aria-hidden />
      )}
      <span className={compact ? "hidden sm:inline" : undefined}>
        {isPending ? t("pending") : t("button")}
      </span>
    </Button>
  );
}

export default DownloadModelButton;
