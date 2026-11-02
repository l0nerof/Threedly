import { FORMAT_BADGE_COLORS } from "@/src/business/constants/catalogConfig";
import type { ModelFileSummary } from "@/src/business/types/modelDownload";
import { cn } from "@/src/shared/utils/cn";
import type { ReactNode } from "react";

type FileDetails = Pick<
  ModelFileSummary,
  "file_name" | "format" | "file_size_bytes" | "is_primary"
>;
type Props<TFile extends FileDetails> = {
  files: TFile[];
  locale: string;
  primaryLabel: string;
  getKey: (file: TFile) => string;
  renderAction: (file: TFile) => ReactNode;
};

export default function ModelFileList<TFile extends FileDetails>({
  files,
  locale,
  primaryLabel,
  getKey,
  renderAction,
}: Props<TFile>) {
  const sizeFormatter = new Intl.NumberFormat(
    locale === "ua" ? "uk-UA" : "en-US",
    {
      style: "unit",
      unit: "megabyte",
      maximumFractionDigits: 2,
    },
  );
  return (
    <ul className="flex flex-col gap-3">
      {files.map((file) => (
        <li
          key={getKey(file)}
          className="border-border/60 flex items-center justify-between gap-4 rounded-xl border p-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase",
                FORMAT_BADGE_COLORS[file.format.toUpperCase()] ??
                  "text-muted-foreground bg-muted",
              )}
            >
              {file.format}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium wrap-anywhere">
                {file.file_name}
              </span>
              <span className="text-muted-foreground text-xs">
                {sizeFormatter.format(file.file_size_bytes / 1_000_000)}
                {file.is_primary ? ` · ${primaryLabel}` : null}
              </span>
            </div>
          </div>
          {renderAction(file)}
        </li>
      ))}
    </ul>
  );
}
