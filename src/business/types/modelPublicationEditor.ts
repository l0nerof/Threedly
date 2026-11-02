import type { CategoryGroupOption } from "@/src/business/types/category";
import type {
  PublicationEditorData,
  PublicationFailure,
} from "@/src/business/types/modelPublication";

export type PublicationEditorProps = {
  ownerId: string;
  canUpload: boolean;
  categoryGroups: CategoryGroupOption[] | null;
  initial: PublicationEditorData | null;
};
export type PublicationEditorFiles = {
  source: File | null;
  cover: File | null;
};
export type PublicationEditorIntent =
  | "save"
  | "publish"
  | "cancel"
  | "delete"
  | "cleanup"
  | "reload";
export type PublicationEditorError = PublicationFailure["error"];
