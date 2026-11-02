import { LocaleCode } from "@/src/business/constants/localization";
import {
  publicationManifestSchema,
  publicationMetadataSchema,
} from "@/src/business/schemas/modelPublication";
import type { Database } from "@/src/business/types/database.generated";
import type {
  PublicationAsset,
  PublicationDraft,
  PublicationEditorData,
  PublicationRpc,
} from "@/src/business/types/modelPublication";
import { mapCategoryGroupRowsToOptions } from "@/src/business/utils/categories";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NavigationGuardProvider } from "nextjs-nav-guard";
import { type ReactNode, createElement } from "react";
import { vi } from "vitest";
import {
  installModelManagementBrowserApis,
  modelManagementFixture,
  modelManagementMocks,
  modelManagementRouter,
  resetModelManagementMocks,
} from "./model-management";
import {
  publicationFixture,
  publicationMocks,
  publicationRow,
  publicationStoredAsset,
  resetPublicationMocks,
} from "./model-publication";

type Args = Database["public"]["Functions"]["manage_publication_draft"]["Args"];
const navigationRouter = {
  ...modelManagementRouter,
  back: vi.fn(),
  forward: vi.fn(),
  bfcacheId: "publication-editor-test",
};
export function EditorNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  return createElement(
    AppRouterContext.Provider,
    { value: navigationRouter },
    createElement(NavigationGuardProvider, null, children),
  );
}
const user = modelManagementFixture.user;
const source: PublicationAsset = {
  ...publicationFixture.source,
  state: "active",
  path: `${user.id}/${publicationFixture.draft.id}/${publicationFixture.source.id}.obj`,
};
const cover: PublicationAsset = {
  ...publicationFixture.cover,
  path: `${user.id}/${publicationFixture.draft.id}/${publicationFixture.cover.id}.png`,
};
const initialDraft: PublicationDraft = {
  ...publicationFixture.draft,
  creator_id: user.id,
  title_ua: "Диван",
  title_en: "Sofa",
  category_id: modelManagementFixture.model.category_id,
  source_asset_id: source.id,
  cover_asset_id: cover.id,
};
const url = () =>
  `http://127.0.0.1:55321/storage/v1/object/sign/model-draft-images/${cover.path}?token=test`;
export function editorInitialData(): PublicationEditorData {
  const {
    source_asset_id: _source,
    cover_asset_id: _cover,
    ...draft
  } = initialDraft;
  void _source;
  void _cover;
  const summary = (asset: PublicationAsset) => ({
    id: asset.id,
    kind: asset.kind,
    name: asset.name,
    size: asset.size,
    extension: asset.extension,
  });
  return {
    draft: { ...draft },
    source: summary(source),
    cover: summary(cover),
    coverUrl: url(),
    cleanupPending: false,
  };
}
export const editorFixture = {
  user,
  author: { id: user.id, username: "creator_test", avatar_path: null },
  source,
  cover,
  categories: mapCategoryGroupRowsToOptions(
    modelManagementFixture.categoryGroups,
    LocaleCode.English,
  ),
  draftId: initialDraft.id,
};
let draft: PublicationDraft = { ...initialDraft };
let active: PublicationAsset[] = [source, cover];
let pendingAssets: PublicationAsset[] = [];
let reserved: PublicationAsset | null = null;
let args: Args = {
  requested_draft_id: initialDraft.id,
  requested_operation: "cleanup",
};
let exists = true;

export const editorMocks = {
  ...publicationMocks,
  serverClient: vi.fn(),
  browserClient: vi.fn(),
  authorSelect: vi.fn(),
  authorEq: vi.fn(),
  authorSingle: vi.fn(),
};
export function setEditorDraft(
  patch: Partial<PublicationDraft>,
  assets?: PublicationAsset[],
) {
  draft = { ...draft, ...patch };
  if (assets) {
    active = assets.filter((asset) => asset.state === "active");
    pendingAssets = assets.filter((asset) => asset.state !== "active");
    reserved = null;
  }
}
export function resetEditorMocks(empty = false) {
  resetModelManagementMocks();
  modelManagementRouter.replace.mockReset();
  resetPublicationMocks();
  exists = true;
  reserved = null;
  draft = empty
    ? { ...publicationFixture.draft, creator_id: user.id }
    : { ...initialDraft };
  active = empty ? [] : [source, cover];
  pendingAssets = [];
  publicationMocks.getUser.mockResolvedValue({ data: { user }, error: null });
  editorMocks.authorSingle
    .mockReset()
    .mockResolvedValue({ data: editorFixture.author, error: null });
  editorMocks.authorEq.mockReset().mockReturnValue({
    abortSignal: () => ({ maybeSingle: editorMocks.authorSingle }),
  });
  editorMocks.authorSelect
    .mockReset()
    .mockImplementation((columns: string) =>
      columns === "id,username,avatar_path"
        ? { eq: editorMocks.authorEq }
        : modelManagementMocks.from("profiles").select(columns),
    );
  const from = (table: string) =>
    table === "profiles"
      ? { select: editorMocks.authorSelect }
      : table.startsWith("model_publication_")
        ? publicationMocks.from(table)
        : modelManagementMocks.from(table);
  const client = {
    auth: { getUser: modelManagementMocks.getUser },
    from,
    rpc: publicationMocks.rpc,
    storage: { from: publicationMocks.storageFrom },
  };
  editorMocks.serverClient.mockReset().mockResolvedValue(client);
  editorMocks.browserClient.mockReset().mockReturnValue(client);
  publicationMocks.rpc.mockImplementation((name: string, input: Args) => {
    void name;
    args = input;
    return { abortSignal: publicationMocks.rpcAbort };
  });
  publicationMocks.readSingle.mockImplementation(async () => ({
    data: exists ? { ...draft } : null,
    error: null,
  }));
  publicationMocks.assetsResult.mockImplementation(async () => ({
    data: active.map(publicationStoredAsset),
    error: null,
  }));
  publicationMocks.assetCountResult.mockImplementation(async () => ({
    data: null,
    count: active.length + pendingAssets.length + (reserved ? 1 : 0),
    error: null,
  }));
  publicationMocks.createSignedUrl.mockImplementation(async () => ({
    data: { signedUrl: url() },
    error: null,
  }));
  publicationMocks.countResult.mockResolvedValue({ count: 0, error: null });
  publicationMocks.listResult.mockResolvedValue({ data: [], error: null });
  publicationMocks.rpcSingle.mockImplementation(async () => {
    const operation = args.requested_operation;
    let assets: PublicationAsset[] = [];
    let removed = false;
    if (operation === "create")
      draft = { ...draft, id: args.requested_draft_id };
    if (operation === "save") {
      const value = publicationMetadataSchema.parse(args.requested_payload);
      draft = {
        ...draft,
        title_ua: value.titleUa,
        title_en: value.titleEn,
        description_ua: value.descriptionUa,
        description_en: value.descriptionEn,
        category_id: value.categoryId,
        minimum_plan: value.minimumPlan,
        revision: draft.revision + 1,
      };
    }
    if (operation === "reserve") {
      const value = publicationManifestSchema.parse(args.requested_payload);
      const base = value.kind === "source" ? source : cover;
      reserved = {
        ...base,
        ...value,
        state: "reserved",
        draftId: draft.id,
        path: `${user.id}/${draft.id}/${base.id}.${value.extension}`,
      };
      assets = [reserved];
    }
    if (operation === "attach" && reserved) {
      const asset = { ...reserved, state: "active" as const };
      active = [...active.filter((item) => item.kind !== asset.kind), asset];
      draft = {
        ...draft,
        revision: draft.revision + 1,
        ...(asset.kind === "source"
          ? { source_asset_id: asset.id }
          : { cover_asset_id: asset.id }),
      };
      reserved = null;
    }
    if (operation === "prepare_publish") {
      draft = {
        ...draft,
        revision: draft.revision + 1,
        lifecycle: "publishing",
        publication_model_id: publicationFixture.modelId,
      };
      assets = active.map((asset) => ({
        ...asset,
        destinationBucket: asset.kind === "source" ? "models" : "model-images",
        destinationPath: `${user.id}/${publicationFixture.modelId}/${asset.kind === "source" ? "sofa.obj" : "cover.png"}`,
      }));
    }
    if (operation === "finish_publish") {
      draft = {
        ...draft,
        revision: draft.revision + 1,
        lifecycle: "published",
        source_asset_id: null,
        cover_asset_id: null,
      };
      pendingAssets.push(
        ...active.map((asset) => ({ ...asset, state: "retired" as const })),
      );
      active = [];
    }
    if (operation === "cancel_publish")
      draft = {
        ...draft,
        revision: draft.revision + 1,
        lifecycle: "cancelling",
      };
    if (operation === "begin_delete") {
      draft = { ...draft, revision: draft.revision + 1, lifecycle: "deleting" };
      pendingAssets.push(...active, ...(reserved ? [reserved] : []));
      active = [];
      reserved = null;
      pendingAssets = pendingAssets.map((asset) => ({
        ...asset,
        state: "deleting",
      }));
    }
    if (operation === "cleanup")
      pendingAssets = pendingAssets.map((asset) => ({
        ...asset,
        state: "deleting",
      }));
    if (operation === "finish_cleanup")
      pendingAssets = pendingAssets.filter(
        (asset) => asset.state !== "deleting",
      );
    if (operation === "finish_cleanup" && draft.lifecycle === "deleting") {
      removed = true;
      exists = false;
    }
    if (operation === "finish_cleanup" && draft.lifecycle === "cancelling")
      draft = {
        ...draft,
        revision: draft.revision + 1,
        lifecycle: "draft",
        publication_model_id: null,
      };
    const result: PublicationRpc = publicationRow({
      draft_id: draft.id,
      revision: removed ? null : draft.revision,
      lifecycle: removed ? null : draft.lifecycle,
      model_id: draft.publication_model_id,
      assets,
      objects:
        operation === "cleanup"
          ? pendingAssets.map((asset) => ({
              bucket: asset.bucket,
              path: asset.path,
            }))
          : [],
    });
    return { data: result, error: null };
  });
}
export function installEditorBrowserApis() {
  const cleanup = installModelManagementBrowserApis();
  const originalCreate = Object.getOwnPropertyDescriptor(
    URL,
    "createObjectURL",
  );
  const originalRevoke = Object.getOwnPropertyDescriptor(
    URL,
    "revokeObjectURL",
  );
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:http://localhost/selected-cover"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  return () => {
    cleanup();
    if (originalCreate)
      Object.defineProperty(URL, "createObjectURL", originalCreate);
    else Reflect.deleteProperty(URL, "createObjectURL");
    if (originalRevoke)
      Object.defineProperty(URL, "revokeObjectURL", originalRevoke);
    else Reflect.deleteProperty(URL, "revokeObjectURL");
  };
}
