import type { CategoryGroupOption } from "@/src/business/types/category";
import type { ModelUploadActionResult } from "@/src/business/types/modelUpload";
import type { LucideIcon } from "lucide-react";

export type ModelUploadFormProps = {
  categoryGroups: CategoryGroupOption[];
  onUploadAction: (formData: FormData) => Promise<ModelUploadActionResult>;
};

export type UploadCategoryOption = {
  id: string;
  value: string;
  label: string;
  groupLabel: string;
  searchLabel: string;
};

export type UploadFileFieldName =
  | "coverImage"
  | "modelFile"
  | "previewModelFile";

export type UploadFileState = Record<UploadFileFieldName, string>;

export type ReadinessItem = {
  key: string;
  label: string;
  isComplete: boolean;
};

export type SectionHeadingVariant = "primary" | "accent" | "secondary";

export type SectionHeadingIcon = LucideIcon;
