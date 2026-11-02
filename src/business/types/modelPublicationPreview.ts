import type { Tables } from "@/src/business/types/database.generated";
import type { ModelFileSummary } from "@/src/business/types/modelDownload";
import type {
  PublicationEditorData,
  PublicationMetadata,
} from "@/src/business/types/modelPublication";

export type PublicationPreviewAuthor = Pick<
  Tables<"profiles">,
  "id" | "username" | "avatar_path"
>;
export type PublicationPreviewSnapshot = {
  metadata: PublicationMetadata;
  source: Pick<
    ModelFileSummary,
    "file_name" | "format" | "file_size_bytes" | "is_primary"
  > | null;
  coverFile: File | null;
  savedCover: {
    draftId: PublicationEditorData["draft"]["id"];
    assetId: string;
  } | null;
};
