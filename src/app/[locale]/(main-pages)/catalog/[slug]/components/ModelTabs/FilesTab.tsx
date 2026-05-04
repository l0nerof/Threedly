import { FORMAT_BADGE_COLORS } from "@/src/business/constants/catalogConfig";
import { Button } from "@/src/shared/components/Button";
import { cn } from "@/src/shared/utils/cn";
import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";

const MOCK_FILES = [
  {
    format: "GLB",
    label: "GLB file",
    description: "Useful for quick previews.",
    size: "4.2 MB",
  },
  {
    format: "FBX",
    label: "FBX file",
    description: "Best for animation pipelines.",
    size: "8.7 MB",
  },
  {
    format: "OBJ",
    label: "OBJ file",
    description: "Universal mesh export.",
    size: "3.1 MB",
  },
];

async function FilesTab() {
  const t = await getTranslations("ModelPage.tabs");

  return (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-muted-foreground text-sm">
        {t("filesAndFormatsDescription")}
      </p>
      <div className="flex flex-col gap-3">
        {MOCK_FILES.map((file) => (
          <div
            key={file.format}
            className="border-border/60 flex items-center justify-between gap-4 rounded-xl border p-4"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase",
                  FORMAT_BADGE_COLORS[file.format] ??
                    "text-muted-foreground bg-muted",
                )}
              >
                {file.format}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{file.label}</span>
                <span className="text-muted-foreground text-xs">
                  {file.description}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="text-muted-foreground text-sm">{file.size}</span>
              <Button size="sm" className="rounded-xl">
                <Download className="size-4" aria-hidden />
                {t("filesAndFormatsDownload")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FilesTab;
