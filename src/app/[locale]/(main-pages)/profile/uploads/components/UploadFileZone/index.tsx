import type { UploadFileFieldName } from "@/src/business/types/upload";
import { getModelUploadControlValidationProps } from "@/src/business/utils/modelUploadForm";
import { Input } from "@/src/shared/components/Input";
import { cn } from "@/src/shared/utils/cn";
import type { LucideIcon } from "lucide-react";
import type { ChangeEvent } from "react";

type UploadFileZoneProps = {
  id: UploadFileFieldName;
  name: UploadFileFieldName;
  accept: string;
  title: string;
  description: string;
  selectedFileName: string;
  emptyLabel: string;
  selectedLabel: string;
  required?: boolean;
  invalid: boolean;
  inputProps: ReturnType<typeof getModelUploadControlValidationProps>;
  icon: LucideIcon;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function UploadFileZone({
  id,
  name,
  accept,
  title,
  description,
  selectedFileName,
  emptyLabel,
  selectedLabel,
  required = false,
  invalid,
  inputProps,
  icon: Icon,
  onChange,
}: UploadFileZoneProps) {
  return (
    <label
      htmlFor={id}
      data-slot="upload-file-zone"
      className={cn(
        "group border-border/70 bg-background/60 hover:border-primary/50 hover:bg-primary/5 focus-within:border-ring focus-within:ring-ring/40 relative flex h-full min-h-[158px] cursor-pointer flex-col justify-between gap-4 rounded-2xl border p-4 shadow-xs transition-all focus-within:ring-[3px]",
        invalid && "border-destructive/70 bg-destructive/5",
      )}
    >
      <span className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {title}
            {required ? (
              <span aria-hidden className="text-destructive">
                *
              </span>
            ) : null}
          </span>
          <span className="text-muted-foreground text-xs leading-5">
            {description}
          </span>
        </span>
      </span>
      <span className="border-border/70 bg-surface text-muted-foreground group-hover:text-foreground flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 text-sm transition-colors">
        <span className="min-w-0 truncate" title={selectedFileName}>
          {selectedFileName || emptyLabel}
        </span>
        <span className="text-primary shrink-0 text-xs font-medium">
          {selectedFileName ? selectedLabel : ""}
        </span>
      </span>
      <Input
        id={id}
        name={name}
        type="file"
        accept={accept}
        aria-required={required}
        className="sr-only"
        onChange={onChange}
        {...inputProps}
      />
    </label>
  );
}

export default UploadFileZone;
