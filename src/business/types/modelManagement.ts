import type { modelManagementErrorCodes } from "@/src/business/constants/modelManagement";
import type {
  modelManagementMetadataSchema,
  modelManagementRpcRowSchema,
  ownedModelRowSchema,
  ownedModelsRowsSchema,
} from "@/src/business/schemas/modelManagement";
import type {
  CategoryGroupOption,
  CategoryGroupRow,
} from "@/src/business/types/category";
import type { z } from "zod";

export type ModelManagementError = (typeof modelManagementErrorCodes)[number];
export type ModelManagementFailure = { ok: false; error: ModelManagementError };
export type ModelManagementResult =
  | { ok: true; modelId: string }
  | ModelManagementFailure;
export type OwnedModelReadResult =
  | { ok: true; model: z.infer<typeof ownedModelRowSchema> }
  | ModelManagementFailure;
export type ModelManagementMetadata = z.infer<
  typeof modelManagementMetadataSchema
>;
export type ModelManagementRpcRow = z.infer<typeof modelManagementRpcRowSchema>;
export type OwnedModel = z.infer<typeof ownedModelRowSchema>;
export type OwnedModelsPage = {
  profileId: string;
  canUpload: boolean;
  models: z.infer<typeof ownedModelsRowsSchema>;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  categoryGroups: CategoryGroupRow[] | null;
};
export type OwnedModelsPageResult =
  | { ok: true; page: OwnedModelsPage }
  | ModelManagementFailure;
export type ModelManagementIntent =
  | { type: "update"; metadata: ModelManagementMetadata }
  | { type: "archive" | "publish" | "delete" };
export type ModelManagementRow = OwnedModelsPage["models"][number];
export type ModelManagementControlsProps = {
  model: ModelManagementRow;
  ownerId: string;
  canUpload: boolean;
  categoryGroups: CategoryGroupOption[] | null;
};
