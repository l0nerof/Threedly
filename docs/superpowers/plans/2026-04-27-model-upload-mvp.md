# Model Upload MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an authenticated MVP flow where a creator uploads one 3D model file from `/profile/uploads`, stores it in Supabase Storage, and records draft metadata in the existing marketplace tables.

**Architecture:** The upload stays inside the existing profile route group and uses a server action so validation, authenticated Supabase writes, and cleanup happen on the server. Files go to a private Supabase Storage bucket named `marketplace-files`; metadata is saved to existing `models` and `model_files` rows with `status = 'draft'`, so uploaded assets do not appear in the public catalog until a separate publishing workflow exists.

**Tech Stack:** Next.js App Router, React 19, TypeScript, next-intl, Supabase SSR client, Supabase Storage RLS, zod, React Hook Form, Vitest, React Testing Library, Playwright.

---

## Context Loaded

- `README.md`, `docs/project-context.md`, `docs/development-guide.md`, `unit/README.md`, and `e2e/README.md`.
- Existing avatar upload flow in `src/app/[locale]/(main-pages)/profile/settings/actions.ts` and `ProfileSettingsForm`.
- Existing profile uploads shell in `src/app/[locale]/(main-pages)/profile/uploads/page.tsx`.
- Existing schema in `supabase/migrations/20260415202000_initial_local_marketplace.sql`.
- Existing catalog reads from `public.models` in `src/app/[locale]/(main-pages)/catalog/actions.ts`.
- Supabase MCP table listing. The connected project currently exposes only a slimmer `public.profiles` shape than the local migration, so implementation must verify migration state before testing against remote Supabase.
- Supabase Storage docs:
  - https://supabase.com/docs/guides/storage/security/access-control
  - https://supabase.com/docs/guides/storage/buckets/creating-buckets
  - https://supabase.com/docs/guides/storage/schema/helper-functions

## MVP Assumptions

- Upload entry point is the existing authenticated `/profile/uploads` page.
- MVP accepts authenticated users without enforcing `profiles.can_upload`, because subscription/billing gating is not implemented and the connected remote schema shown by MCP does not currently expose that column.
- Uploaded models are drafts and are not shown in the public catalog.
- A cover image upload is outside this plan. Draft models use the existing `/logo.png` placeholder for `cover_image_path`, because `models.cover_image_path` is currently `not null`.
- Bucket name is `marketplace-files`, matching the existing `model_files.bucket` seed data.
- Bucket is private. Public downloads and signed download URLs are outside this plan.
- MVP file limit is `50 MiB`, matching the current local Supabase storage limit in `supabase/config.toml`.
- Allowed extensions are `glb`, `gltf`, `fbx`, `obj`, `max`, `blend`, and `zip`. Bucket MIME restrictions stay broad because browser MIME values for many 3D formats are inconsistent; server validation enforces extension and size.

## Files

- Create: `supabase/migrations/20260427120000_add_model_upload_storage.sql`
- Create: `src/business/constants/modelUpload.ts`
- Create: `src/business/schemas/modelUpload.ts`
- Create: `src/business/types/modelUpload.ts`
- Create: `src/business/utils/modelUpload.ts`
- Create: `src/app/[locale]/(main-pages)/profile/uploads/actions.ts`
- Create: `src/app/[locale]/(main-pages)/profile/uploads/components/ModelUploadForm/index.tsx`
- Modify: `src/app/[locale]/(main-pages)/profile/uploads/page.tsx`
- Modify: `messages/ua.json`
- Modify: `messages/en.json`
- Create: `unit/tests/model-upload-utils.spec.ts`
- Create: `unit/tests/model-upload-schema.spec.ts`
- Create: `unit/tests/model-upload-action.spec.ts`
- Modify: `e2e/pages/profile.page.ts`
- Modify: `e2e/tests/profile.spec.ts`
- Modify: `unit/README.md`
- Modify: `e2e/README.md`

---

### Task 1: Add Storage Bucket And RLS Policies

**Files:**

- Create: `supabase/migrations/20260427120000_add_model_upload_storage.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260427120000_add_model_upload_storage.sql`:

```sql
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'marketplace-files',
  'marketplace-files',
  false,
  52428800,
  null
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.models enable row level security;
alter table public.model_files enable row level security;

drop policy if exists "Published models are publicly readable" on public.models;
create policy "Published models are publicly readable"
  on public.models
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Creators can read their own models" on public.models;
create policy "Creators can read their own models"
  on public.models
  for select
  to authenticated
  using (creator_id = (select auth.uid()));

drop policy if exists "Creators can insert draft models" on public.models;
create policy "Creators can insert draft models"
  on public.models
  for insert
  to authenticated
  with check (
    creator_id = (select auth.uid())
    and status = 'draft'
  );

drop policy if exists "Creators can delete own draft models" on public.models;
create policy "Creators can delete own draft models"
  on public.models
  for delete
  to authenticated
  using (
    creator_id = (select auth.uid())
    and status = 'draft'
  );

drop policy if exists "Creators can read their own model file rows" on public.model_files;
create policy "Creators can read their own model file rows"
  on public.model_files
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.models
      where models.id = model_files.model_id
        and models.creator_id = (select auth.uid())
    )
  );

drop policy if exists "Creators can insert their own model file rows" on public.model_files;
create policy "Creators can insert their own model file rows"
  on public.model_files
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.models
      where models.id = model_files.model_id
        and models.creator_id = (select auth.uid())
    )
  );

drop policy if exists "Creators can delete their own model file rows" on public.model_files;
create policy "Creators can delete their own model file rows"
  on public.model_files
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.models
      where models.id = model_files.model_id
        and models.creator_id = (select auth.uid())
    )
  );

drop policy if exists "Creators can read their own stored model files" on storage.objects;
create policy "Creators can read their own stored model files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'marketplace-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Creators can upload their own model files" on storage.objects;
create policy "Creators can upload their own model files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'marketplace-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Creators can delete their own stored model files" on storage.objects;
create policy "Creators can delete their own stored model files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'marketplace-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
```

- [ ] **Step 2: Apply the migration locally**

Run:

```bash
npm run db:reset
```

Expected:

```text
Finished supabase db reset.
```

- [ ] **Step 3: Verify catalog read still works after RLS**

Run:

```bash
npm run typecheck
```

Expected:

```text
No TypeScript errors.
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260427120000_add_model_upload_storage.sql
git commit -m "feat: add model upload storage policies"
```

---

### Task 2: Add Upload Constants, Schema, And Helpers

**Files:**

- Create: `src/business/constants/modelUpload.ts`
- Create: `src/business/schemas/modelUpload.ts`
- Create: `src/business/types/modelUpload.ts`
- Create: `src/business/utils/modelUpload.ts`
- Test: `unit/tests/model-upload-utils.spec.ts`
- Test: `unit/tests/model-upload-schema.spec.ts`

- [ ] **Step 1: Write failing utility tests**

Create `unit/tests/model-upload-utils.spec.ts`:

```ts
import {
  buildModelUploadSlug,
  buildModelUploadStoragePath,
  getModelUploadFileExtension,
  sanitizeModelUploadFileName,
} from "@/src/business/utils/modelUpload";
import { describe, expect, it } from "../fixtures";

describe("model upload utils", () => {
  it("returns a supported extension in lowercase", () => {
    expect(getModelUploadFileExtension("Chair.GLB")).toBe("glb");
  });

  it("rejects unsupported or missing extensions", () => {
    expect(getModelUploadFileExtension("chair.exe")).toBeNull();
    expect(getModelUploadFileExtension("chair")).toBeNull();
  });

  it("sanitizes uploaded file names without changing the extension", () => {
    expect(sanitizeModelUploadFileName("Soft Chair Final.GLB")).toBe(
      "soft-chair-final.glb",
    );
  });

  it("builds a private user and model scoped storage path", () => {
    expect(
      buildModelUploadStoragePath({
        userId: "user-1",
        modelId: "model-1",
        fileName: "Soft Chair Final.GLB",
      }),
    ).toBe("user-1/model-1/soft-chair-final.glb");
  });

  it("builds a stable catalog-safe draft slug", () => {
    expect(
      buildModelUploadSlug(
        "Soft Chair Final",
        "11111111-2222-3333-4444-555555555555",
      ),
    ).toBe("soft-chair-final-11111111");
  });
});
```

Create `unit/tests/model-upload-schema.spec.ts`:

```ts
import { modelUploadMetadataSchema } from "@/src/business/schemas/modelUpload";
import { describe, expect, it } from "../fixtures";

const validValues = {
  titleUa: "М'яке крісло",
  titleEn: "Soft chair",
  descriptionUa: "",
  descriptionEn: "",
  categoryId: "00000000-0000-0000-0000-000000000001",
  minimumPlan: "free",
};

describe("modelUploadMetadataSchema", () => {
  it("accepts valid bilingual draft metadata", () => {
    const result = modelUploadMetadataSchema.safeParse(validValues);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.descriptionUa).toBeNull();
      expect(result.data.descriptionEn).toBeNull();
    }
  });

  it("rejects missing titles", () => {
    const result = modelUploadMetadataSchema.safeParse({
      ...validValues,
      titleUa: "",
      titleEn: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid category ids", () => {
    const result = modelUploadMetadataSchema.safeParse({
      ...validValues,
      categoryId: "chairs",
    });

    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test:unit -- unit/tests/model-upload-utils.spec.ts unit/tests/model-upload-schema.spec.ts
```

Expected:

```text
FAIL unit/tests/model-upload-utils.spec.ts
FAIL unit/tests/model-upload-schema.spec.ts
```

- [ ] **Step 3: Add constants**

Create `src/business/constants/modelUpload.ts`:

```ts
export const MODEL_UPLOAD_BUCKET = "marketplace-files";
export const MODEL_UPLOAD_STORAGE_PROVIDER = "supabase";
export const MODEL_UPLOAD_DEFAULT_COVER_PATH = "/logo.png";
export const MAX_MODEL_UPLOAD_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const modelUploadExtensions = [
  "glb",
  "gltf",
  "fbx",
  "obj",
  "max",
  "blend",
  "zip",
] as const;
```

- [ ] **Step 4: Add schema and types**

Create `src/business/schemas/modelUpload.ts`:

```ts
import { catalogPlanKeys } from "@/src/business/constants/catalogConfig";
import { z } from "zod";

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(600, "errors.descriptionTooLong")
  .transform((value) => (value.length > 0 ? value : null));

export const modelUploadMetadataSchema = z.object({
  titleUa: z.string().trim().min(2, "errors.titleRequired").max(90),
  titleEn: z.string().trim().min(2, "errors.titleRequired").max(90),
  descriptionUa: optionalDescriptionSchema,
  descriptionEn: optionalDescriptionSchema,
  categoryId: z.string().uuid("errors.categoryRequired"),
  minimumPlan: z.enum(catalogPlanKeys),
});
```

Create `src/business/types/modelUpload.ts`:

```ts
import type { modelUploadExtensions } from "@/src/business/constants/modelUpload";
import type { modelUploadMetadataSchema } from "@/src/business/schemas/modelUpload";
import type { z } from "zod";

export type ModelUploadExtension = (typeof modelUploadExtensions)[number];

export type ModelUploadMetadataValues = z.infer<
  typeof modelUploadMetadataSchema
>;

export type ModelUploadActionError =
  | "invalidLocale"
  | "invalidMetadata"
  | "invalidFile"
  | "fileTooLarge"
  | "unsupportedFileType"
  | "unauthorized"
  | "uploadFailed"
  | "metadataSaveFailed"
  | "generic";

export type ModelUploadActionResult =
  | {
      ok: true;
      modelId: string;
    }
  | {
      ok: false;
      error: ModelUploadActionError;
    };
```

- [ ] **Step 5: Add helpers**

Create `src/business/utils/modelUpload.ts`:

```ts
import { modelUploadExtensions } from "@/src/business/constants/modelUpload";
import type { ModelUploadExtension } from "@/src/business/types/modelUpload";

type BuildStoragePathParams = {
  userId: string;
  modelId: string;
  fileName: string;
};

function isModelUploadExtension(value: string): value is ModelUploadExtension {
  return modelUploadExtensions.includes(value as ModelUploadExtension);
}

export function getModelUploadFileExtension(
  fileName: string,
): ModelUploadExtension | null {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension || extension === fileName.toLowerCase()) {
    return null;
  }

  return isModelUploadExtension(extension) ? extension : null;
}

export function sanitizeModelUploadFileName(fileName: string): string {
  const extension = getModelUploadFileExtension(fileName);
  const fallbackName = extension ? `model.${extension}` : "model";
  const fileExtension = extension ?? "bin";

  const normalizedFileName = fileName.trim() || fallbackName;
  const dotIndex = normalizedFileName.lastIndexOf(".");
  const rawName =
    dotIndex > 0 ? normalizedFileName.slice(0, dotIndex) : normalizedFileName;

  const safeName = rawName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${safeName || "model"}.${fileExtension}`;
}

export function buildModelUploadStoragePath({
  userId,
  modelId,
  fileName,
}: BuildStoragePathParams): string {
  return `${userId}/${modelId}/${sanitizeModelUploadFileName(fileName)}`;
}

export function buildModelUploadSlug(titleEn: string, modelId: string): string {
  const baseSlug = titleEn
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${baseSlug || "model"}-${modelId.slice(0, 8)}`;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
npm run test:unit -- unit/tests/model-upload-utils.spec.ts unit/tests/model-upload-schema.spec.ts
```

Expected:

```text
PASS unit/tests/model-upload-utils.spec.ts
PASS unit/tests/model-upload-schema.spec.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/business/constants/modelUpload.ts src/business/schemas/modelUpload.ts src/business/types/modelUpload.ts src/business/utils/modelUpload.ts unit/tests/model-upload-utils.spec.ts unit/tests/model-upload-schema.spec.ts
git commit -m "feat: add model upload validation helpers"
```

---

### Task 3: Add Server Action For Draft Uploads

**Files:**

- Create: `src/app/[locale]/(main-pages)/profile/uploads/actions.ts`
- Test: `unit/tests/model-upload-action.spec.ts`

- [ ] **Step 1: Write focused action tests with mocked Supabase**

Create `unit/tests/model-upload-action.spec.ts`:

```ts
import { uploadModelAction } from "@/src/app/[locale]/(main-pages)/profile/uploads/actions";
import { beforeEach, describe, expect, it, vi } from "../fixtures";

const uploadMock = vi.fn();
const removeMock = vi.fn();
const insertModelSelectMock = vi.fn();
const insertModelSingleMock = vi.fn();
const insertModelFileMock = vi.fn();
const deleteModelEqMock = vi.fn();

vi.mock("@/src/business/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "user-1" } },
      })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        remove: removeMock,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "models") {
        return {
          insert: vi.fn(() => ({
            select: insertModelSelectMock,
          })),
          delete: vi.fn(() => ({
            eq: deleteModelEqMock,
          })),
        };
      }

      return {
        insert: insertModelFileMock,
      };
    }),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function buildValidFormData(file: File): FormData {
  const formData = new FormData();
  formData.set("titleUa", "М'яке крісло");
  formData.set("titleEn", "Soft chair");
  formData.set("descriptionUa", "");
  formData.set("descriptionEn", "");
  formData.set("categoryId", "00000000-0000-0000-0000-000000000001");
  formData.set("minimumPlan", "free");
  formData.set("modelFile", file);

  return formData;
}

describe("uploadModelAction", () => {
  beforeEach(() => {
    uploadMock.mockResolvedValue({ error: null });
    removeMock.mockResolvedValue({ error: null });
    insertModelSelectMock.mockReturnValue({
      single: insertModelSingleMock,
    });
    insertModelSingleMock.mockResolvedValue({
      data: { id: "11111111-2222-3333-4444-555555555555" },
      error: null,
    });
    insertModelFileMock.mockResolvedValue({ error: null });
    deleteModelEqMock.mockResolvedValue({ error: null });
  });

  it("uploads the file and saves model metadata", async () => {
    const result = await uploadModelAction(
      "ua",
      buildValidFormData(new File(["model"], "chair.glb")),
    );

    expect(result).toEqual({
      ok: true,
      modelId: "11111111-2222-3333-4444-555555555555",
    });
    expect(uploadMock).toHaveBeenCalledOnce();
    expect(insertModelFileMock).toHaveBeenCalledOnce();
  });

  it("rejects unsupported files before storage upload", async () => {
    const result = await uploadModelAction(
      "ua",
      buildValidFormData(new File(["model"], "chair.exe")),
    );

    expect(result).toEqual({ ok: false, error: "unsupportedFileType" });
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("removes the stored file if metadata save fails", async () => {
    insertModelSingleMock.mockResolvedValueOnce({
      data: null,
      error: { message: "insert failed" },
    });

    const result = await uploadModelAction(
      "ua",
      buildValidFormData(new File(["model"], "chair.glb")),
    );

    expect(result).toEqual({ ok: false, error: "metadataSaveFailed" });
    expect(removeMock).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test:unit -- unit/tests/model-upload-action.spec.ts
```

Expected:

```text
FAIL unit/tests/model-upload-action.spec.ts
```

- [ ] **Step 3: Add the action**

Create `src/app/[locale]/(main-pages)/profile/uploads/actions.ts`:

```ts
"use server";

import {
  MAX_MODEL_UPLOAD_FILE_SIZE_BYTES,
  MODEL_UPLOAD_BUCKET,
  MODEL_UPLOAD_DEFAULT_COVER_PATH,
  MODEL_UPLOAD_STORAGE_PROVIDER,
} from "@/src/business/constants/modelUpload";
import { modelUploadMetadataSchema } from "@/src/business/schemas/modelUpload";
import type { ModelUploadActionResult } from "@/src/business/types/modelUpload";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import {
  buildModelUploadSlug,
  buildModelUploadStoragePath,
  getModelUploadFileExtension,
} from "@/src/business/utils/modelUpload";
import { createClient } from "@/src/business/utils/supabase/server";
import { revalidatePath } from "next/cache";

function getRequiredFile(formData: FormData): File | null {
  const fileValue = formData.get("modelFile");

  if (!fileValue || typeof fileValue === "string") {
    return null;
  }

  return fileValue;
}

export async function uploadModelAction(
  locale: string,
  formData: FormData,
): Promise<ModelUploadActionResult> {
  if (!isLocaleCode(locale)) {
    return { ok: false, error: "invalidLocale" };
  }

  const parsedMetadata = modelUploadMetadataSchema.safeParse({
    titleUa: formData.get("titleUa"),
    titleEn: formData.get("titleEn"),
    descriptionUa: formData.get("descriptionUa"),
    descriptionEn: formData.get("descriptionEn"),
    categoryId: formData.get("categoryId"),
    minimumPlan: formData.get("minimumPlan"),
  });

  if (!parsedMetadata.success) {
    return { ok: false, error: "invalidMetadata" };
  }

  const modelFile = getRequiredFile(formData);
  if (!modelFile || modelFile.size === 0) {
    return { ok: false, error: "invalidFile" };
  }

  if (modelFile.size > MAX_MODEL_UPLOAD_FILE_SIZE_BYTES) {
    return { ok: false, error: "fileTooLarge" };
  }

  const fileExtension = getModelUploadFileExtension(modelFile.name);
  if (!fileExtension) {
    return { ok: false, error: "unsupportedFileType" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const modelId = crypto.randomUUID();
  const storagePath = buildModelUploadStoragePath({
    userId: user.id,
    modelId,
    fileName: modelFile.name,
  });

  const { error: uploadError } = await supabase.storage
    .from(MODEL_UPLOAD_BUCKET)
    .upload(storagePath, modelFile, {
      upsert: false,
      contentType: modelFile.type || "application/octet-stream",
      cacheControl: "31536000",
    });

  if (uploadError) {
    console.error("[uploadModelAction] storage upload error", uploadError);
    return { ok: false, error: "uploadFailed" };
  }

  const metadata = parsedMetadata.data;
  const { data: createdModel, error: modelInsertError } = await supabase
    .from("models")
    .insert({
      id: modelId,
      slug: buildModelUploadSlug(metadata.titleEn, modelId),
      creator_id: user.id,
      category_id: metadata.categoryId,
      title_ua: metadata.titleUa,
      title_en: metadata.titleEn,
      description_ua: metadata.descriptionUa,
      description_en: metadata.descriptionEn,
      cover_image_path: MODEL_UPLOAD_DEFAULT_COVER_PATH,
      preview_model_path: null,
      status: "draft",
      minimum_plan: metadata.minimumPlan,
      file_format: fileExtension,
      file_size_bytes: modelFile.size,
      polygon_count: null,
      download_count: 0,
      is_featured: false,
      published_at: null,
    })
    .select("id")
    .single();

  if (modelInsertError || !createdModel) {
    console.error("[uploadModelAction] model insert error", modelInsertError);
    await supabase.storage.from(MODEL_UPLOAD_BUCKET).remove([storagePath]);
    return { ok: false, error: "metadataSaveFailed" };
  }

  const { error: fileInsertError } = await supabase.from("model_files").insert({
    model_id: createdModel.id,
    storage_provider: MODEL_UPLOAD_STORAGE_PROVIDER,
    bucket: MODEL_UPLOAD_BUCKET,
    object_path: storagePath,
    file_name: modelFile.name,
    format: fileExtension,
    file_size_bytes: modelFile.size,
    is_primary: true,
  });

  if (fileInsertError) {
    console.error(
      "[uploadModelAction] model file insert error",
      fileInsertError,
    );
    await supabase.from("models").delete().eq("id", createdModel.id);
    await supabase.storage.from(MODEL_UPLOAD_BUCKET).remove([storagePath]);
    return { ok: false, error: "metadataSaveFailed" };
  }

  revalidatePath(`/${locale}/profile/uploads`);

  return { ok: true, modelId: createdModel.id };
}
```

- [ ] **Step 4: Run the action test**

Run:

```bash
npm run test:unit -- unit/tests/model-upload-action.spec.ts
```

Expected:

```text
PASS unit/tests/model-upload-action.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add 'src/app/[locale]/(main-pages)/profile/uploads/actions.ts' unit/tests/model-upload-action.spec.ts
git commit -m "feat: add model upload server action"
```

---

### Task 4: Build The Profile Upload UI

**Files:**

- Create: `src/app/[locale]/(main-pages)/profile/uploads/components/ModelUploadForm/index.tsx`
- Modify: `src/app/[locale]/(main-pages)/profile/uploads/page.tsx`

- [ ] **Step 1: Add the client form**

Create `src/app/[locale]/(main-pages)/profile/uploads/components/ModelUploadForm/index.tsx`:

```tsx
"use client";

import type {
  ModelUploadActionError,
  ModelUploadActionResult,
} from "@/src/business/types/modelUpload";
import { Button } from "@/src/shared/components/Button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/src/shared/components/Field";
import { Input } from "@/src/shared/components/Input";
import { Textarea } from "@/src/shared/components/Textarea";
import { UploadCloudIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { toast } from "sonner";

type CategoryOption = {
  id: string;
  label: string;
};

type ModelUploadFormProps = {
  categories: CategoryOption[];
  onUploadAction: (formData: FormData) => Promise<ModelUploadActionResult>;
};

function ModelUploadForm({ categories, onUploadAction }: ModelUploadFormProps) {
  const t = useTranslations("Profile.uploads.form");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolveActionError = (error: ModelUploadActionError) => {
    switch (error) {
      case "invalidMetadata":
        return t("errors.invalidMetadata");
      case "invalidFile":
        return t("errors.invalidFile");
      case "fileTooLarge":
        return t("errors.fileTooLarge");
      case "unsupportedFileType":
        return t("errors.unsupportedFileType");
      case "unauthorized":
        return t("errors.unauthorized");
      case "uploadFailed":
        return t("errors.uploadFailed");
      case "metadataSaveFailed":
        return t("errors.metadataSaveFailed");
      case "invalidLocale":
      case "generic":
      default:
        return t("errors.generic");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setServerError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await onUploadAction(formData);

      if (!result.ok) {
        const message = resolveActionError(result.error);
        setServerError(message);
        toast.error(message);
        return;
      }

      formRef.current?.reset();
      toast.success(t("success"));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="contents">
      <CardHeader className="p-0">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
            <UploadCloudIcon className="size-5" aria-hidden />
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription className="leading-6">
              {t("description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="titleUa">{t("titleUa")}</FieldLabel>
              <FieldContent>
                <Input id="titleUa" name="titleUa" required />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="titleEn">{t("titleEn")}</FieldLabel>
              <FieldContent>
                <Input id="titleEn" name="titleEn" required />
              </FieldContent>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="descriptionUa">
                {t("descriptionUa")}
              </FieldLabel>
              <FieldContent>
                <Textarea id="descriptionUa" name="descriptionUa" rows={4} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="descriptionEn">
                {t("descriptionEn")}
              </FieldLabel>
              <FieldContent>
                <Textarea id="descriptionEn" name="descriptionEn" rows={4} />
              </FieldContent>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="categoryId">{t("category")}</FieldLabel>
              <FieldContent>
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{t("categoryPlaceholder")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="minimumPlan">{t("minimumPlan")}</FieldLabel>
              <FieldContent>
                <select
                  id="minimumPlan"
                  name="minimumPlan"
                  defaultValue="free"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="free">{t("plans.free")}</option>
                  <option value="pro">{t("plans.pro")}</option>
                  <option value="max">{t("plans.max")}</option>
                </select>
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="modelFile">{t("file")}</FieldLabel>
            <FieldContent>
              <Input
                id="modelFile"
                name="modelFile"
                type="file"
                accept=".glb,.gltf,.fbx,.obj,.max,.blend,.zip"
                required
              />
              <p className="text-muted-foreground text-xs">{t("fileHint")}</p>
            </FieldContent>
          </Field>

          <FieldError errors={serverError ? [{ message: serverError }] : []} />
        </FieldGroup>
      </CardContent>

      <CardFooter className="justify-end p-0">
        <Button
          type="submit"
          disabled={isSubmitting || categories.length === 0}
        >
          <UploadCloudIcon className="size-4" aria-hidden />
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </CardFooter>
    </form>
  );
}

export default ModelUploadForm;
```

- [ ] **Step 2: Wire the server page**

Modify `src/app/[locale]/(main-pages)/profile/uploads/page.tsx`:

```tsx
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";
import { Badge } from "@/src/shared/components/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import { Separator } from "@/src/shared/components/Separator";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { uploadModelAction } from "./actions";
import ModelUploadForm from "./components/ModelUploadForm";

type Props = {
  params: Promise<{ locale: string }>;
};

type UploadedModelRow = {
  id: string;
  title_ua: string;
  title_en: string;
  status: string;
  file_format: string | null;
  file_size_bytes: number | null;
  created_at: string;
};

function formatFileSize(size: number | null): string {
  if (!size) {
    return "0 MB";
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default async function ProfileUploadsPage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Profile");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const [
    { data: categories, error: categoriesError },
    { data: uploadedModels, error: uploadedModelsError },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name_ua, name_en")
      .order(locale === "ua" ? "name_ua" : "name_en", { ascending: true }),
    supabase
      .from("models")
      .select(
        "id, title_ua, title_en, status, file_format, file_size_bytes, created_at",
      )
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const uploadModelWithLocale = uploadModelAction.bind(null, locale);
  const hasLoadError = Boolean(categoriesError || uploadedModelsError);
  const categoryOptions =
    categories?.map((category) => ({
      id: category.id,
      label: locale === "ua" ? category.name_ua : category.name_en,
    })) ?? [];

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("uploads.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("uploads.subtitle")}
          </p>
        </div>
      </div>
      <Separator />

      {hasLoadError && (
        <p role="alert" className="text-destructive text-sm">
          {t("uploads.loadError")}
        </p>
      )}

      <Card className="border-border/60 gap-4 rounded-2xl p-6 shadow-none">
        <ModelUploadForm
          categories={categoryOptions}
          onUploadAction={uploadModelWithLocale}
        />
      </Card>

      <Card className="border-border/60 gap-4 rounded-2xl p-6 shadow-none">
        <CardHeader className="p-0">
          <CardTitle>{t("uploads.list.title")}</CardTitle>
          <CardDescription>{t("uploads.list.description")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {uploadedModels && uploadedModels.length > 0 ? (
            <div className="divide-border/60 divide-y">
              {(uploadedModels as UploadedModelRow[]).map((model) => {
                const title = locale === "ua" ? model.title_ua : model.title_en;

                return (
                  <article
                    key={model.id}
                    className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <h2 className="text-sm font-medium">{title}</h2>
                      <p className="text-muted-foreground text-xs">
                        {model.file_format?.toUpperCase() ??
                          t("uploads.list.unknownFormat")}
                        {" · "}
                        {formatFileSize(model.file_size_bytes)}
                      </p>
                    </div>
                    <Badge variant="outline" className="w-fit rounded-full">
                      {t(`uploads.status.${model.status}`)}
                    </Badge>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{t("uploads.empty.title")}</p>
              <p className="text-muted-foreground text-sm">
                {t("uploads.empty.description")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
```

- [ ] **Step 3: Run typecheck to catch route wiring issues**

Run:

```bash
npm run typecheck
```

Expected:

```text
No TypeScript errors.
```

- [ ] **Step 4: Commit**

```bash
git add 'src/app/[locale]/(main-pages)/profile/uploads/page.tsx' 'src/app/[locale]/(main-pages)/profile/uploads/components/ModelUploadForm/index.tsx'
git commit -m "feat: add profile model upload form"
```

---

### Task 5: Add Bilingual Upload Copy

**Files:**

- Modify: `messages/ua.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Update Ukrainian messages**

In `messages/ua.json`, replace the existing `Profile.uploads` object with:

```json
"uploads": {
  "title": "Мої моделі",
  "subtitle": "Завантажуйте чернетки моделей у приватне сховище Supabase.",
  "loadError": "Не вдалося завантажити дані для сторінки моделей.",
  "uploadCta": "Завантажити модель",
  "secondaryCta": "Відкрити налаштування",
  "empty": {
    "title": "У вас поки немає моделей",
    "description": "Додайте першу модель, і вона з'явиться у цьому списку як чернетка."
  },
  "form": {
    "title": "Нова 3D-модель",
    "description": "MVP зберігає файл і базові дані як чернетку. Публікація в каталог буде окремим кроком.",
    "titleUa": "Назва українською",
    "titleEn": "Назва англійською",
    "descriptionUa": "Опис українською",
    "descriptionEn": "Опис англійською",
    "category": "Категорія",
    "categoryPlaceholder": "Оберіть категорію",
    "minimumPlan": "Мінімальний план",
    "plans": {
      "free": "Free",
      "pro": "Pro",
      "max": "Max"
    },
    "file": "Файл моделі",
    "fileHint": "Підтримуються GLB, GLTF, FBX, OBJ, MAX, BLEND і ZIP до 50 MB.",
    "submit": "Завантажити модель",
    "submitting": "Завантаження...",
    "success": "Модель завантажено як чернетку.",
    "errors": {
      "invalidMetadata": "Перевірте назви, категорію та рівень доступу.",
      "invalidFile": "Додайте файл моделі.",
      "fileTooLarge": "Файл має бути не більшим за 50 MB.",
      "unsupportedFileType": "Цей формат файлу поки не підтримується.",
      "unauthorized": "Увійдіть в акаунт, щоб завантажити модель.",
      "uploadFailed": "Не вдалося завантажити файл у сховище.",
      "metadataSaveFailed": "Файл завантажено, але дані моделі не збережено. Спробуйте ще раз.",
      "generic": "Не вдалося завантажити модель. Спробуйте ще раз."
    }
  },
  "list": {
    "title": "Завантажені чернетки",
    "description": "Тут показані моделі, які вже прив'язані до вашого профілю.",
    "unknownFormat": "Формат невідомий"
  },
  "status": {
    "draft": "Чернетка",
    "published": "Опубліковано",
    "archived": "Архів"
  }
}
```

- [ ] **Step 2: Update English messages**

In `messages/en.json`, replace the existing `Profile.uploads` object with:

```json
"uploads": {
  "title": "Uploads",
  "subtitle": "Upload draft models into private Supabase storage.",
  "loadError": "Could not load the model upload page data.",
  "uploadCta": "Upload model",
  "secondaryCta": "Open settings",
  "empty": {
    "title": "You do not have models yet",
    "description": "Add your first model and it will appear here as a draft."
  },
  "form": {
    "title": "New 3D model",
    "description": "The MVP stores the file and base metadata as a draft. Publishing to the catalog is a separate step.",
    "titleUa": "Ukrainian title",
    "titleEn": "English title",
    "descriptionUa": "Ukrainian description",
    "descriptionEn": "English description",
    "category": "Category",
    "categoryPlaceholder": "Choose a category",
    "minimumPlan": "Minimum plan",
    "plans": {
      "free": "Free",
      "pro": "Pro",
      "max": "Max"
    },
    "file": "Model file",
    "fileHint": "Supports GLB, GLTF, FBX, OBJ, MAX, BLEND, and ZIP up to 50 MB.",
    "submit": "Upload model",
    "submitting": "Uploading...",
    "success": "Model uploaded as a draft.",
    "errors": {
      "invalidMetadata": "Check the titles, category, and access level.",
      "invalidFile": "Add a model file.",
      "fileTooLarge": "The file must be no larger than 50 MB.",
      "unsupportedFileType": "This file format is not supported yet.",
      "unauthorized": "Sign in to upload a model.",
      "uploadFailed": "Could not upload the file to storage.",
      "metadataSaveFailed": "The file uploaded, but the model metadata was not saved. Try again.",
      "generic": "Could not upload the model. Try again."
    }
  },
  "list": {
    "title": "Uploaded drafts",
    "description": "These models are already linked to your profile.",
    "unknownFormat": "Unknown format"
  },
  "status": {
    "draft": "Draft",
    "published": "Published",
    "archived": "Archived"
  }
}
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected:

```text
No TypeScript errors.
```

- [ ] **Step 4: Commit**

```bash
git add messages/ua.json messages/en.json
git commit -m "feat: localize model upload flow"
```

---

### Task 6: Update E2E Smoke Coverage For Uploads Page

**Files:**

- Modify: `e2e/pages/profile.page.ts`
- Modify: `e2e/tests/profile.spec.ts`

- [ ] **Step 1: Add page object locators**

Modify `e2e/pages/profile.page.ts` by adding locators to the existing profile page object:

```ts
get uploadTitleUaInput() {
  return this.page.getByLabel("Назва українською");
}

get uploadTitleEnInput() {
  return this.page.getByLabel("Назва англійською");
}

get uploadModelFileInput() {
  return this.page.getByLabel("Файл моделі");
}

get uploadSubmitButton() {
  return this.page.getByRole("button", { name: "Завантажити модель" });
}
```

- [ ] **Step 2: Update the uploads page smoke test**

In `e2e/tests/profile.spec.ts`, update the authenticated uploads-page assertion to verify the form exists instead of only the old empty state:

```ts
await expect(profilePage.uploadTitleUaInput).toBeVisible();
await expect(profilePage.uploadTitleEnInput).toBeVisible();
await expect(profilePage.uploadModelFileInput).toBeVisible();
await expect(profilePage.uploadSubmitButton).toBeVisible();
```

- [ ] **Step 3: Run targeted e2e test**

Run:

```bash
npm run e2e -- e2e/tests/profile.spec.ts
```

Expected:

```text
1 passed
```

- [ ] **Step 4: Commit**

```bash
git add e2e/pages/profile.page.ts e2e/tests/profile.spec.ts
git commit -m "test: cover profile upload form smoke"
```

---

### Task 7: Update Test Documentation

**Files:**

- Modify: `unit/README.md`
- Modify: `e2e/README.md`

- [ ] **Step 1: Update unit coverage docs**

Add a section to `unit/README.md`:

```markdown
## Model Upload MVP

- [x] Upload helper returns supported file extensions in lowercase
- [x] Upload helper rejects unsupported file names
- [x] Upload helper builds user/model-scoped storage paths
- [x] Upload metadata schema accepts bilingual draft metadata
- [x] Upload metadata schema rejects missing titles and invalid categories
- [x] Upload server action stores a file and model metadata through mocked Supabase
- [x] Upload server action rejects unsupported files before storage writes
- [x] Upload server action removes stored files when metadata save fails
```

Add rows to the coverage map:

```markdown
| Model upload helpers | `src/business/utils/modelUpload.ts` | `model-upload-utils.spec.ts` | `[x] Covered` |
| Model upload schema | `src/business/schemas/modelUpload.ts` | `model-upload-schema.spec.ts` | `[x] Covered` |
| Model upload action | `src/app/[locale]/(main-pages)/profile/uploads/actions.ts` | `model-upload-action.spec.ts` | `[x] Covered` |
```

- [ ] **Step 2: Update e2e coverage docs**

In `e2e/README.md`, update the authenticated Profile section:

```markdown
- [x] Uploads page renders the model upload form
- [x] Uploads page renders the uploaded drafts panel
```

- [ ] **Step 3: Commit**

```bash
git add unit/README.md e2e/README.md
git commit -m "docs: document model upload test coverage"
```

---

### Task 8: Final Verification

**Files:**

- All files changed by Tasks 1-7

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected:

```text
No TypeScript errors.
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected:

```text
No ESLint errors.
```

- [ ] **Step 3: Run unit tests**

```bash
npm run test:unit
```

Expected:

```text
Test Files  all passed
```

- [ ] **Step 4: Run relevant e2e coverage**

```bash
npm run e2e -- e2e/tests/profile.spec.ts
```

Expected:

```text
1 passed
```

- [ ] **Step 5: Run Supabase advisors after migration**

Use the Supabase MCP advisors:

```text
mcp__supabase__.get_advisors({ "type": "security" })
mcp__supabase__.get_advisors({ "type": "performance" })
```

Expected:

```text
No new critical security or performance issues from the upload migration.
```

- [ ] **Step 6: Manual browser check**

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/ua/profile/uploads
```

Verify:

- Authenticated users see the upload form.
- Required form fields have visible labels.
- Unsupported files return a translated error.
- A small `.glb` fixture uploads successfully.
- The uploaded model appears in the drafts list.
- The file appears under `marketplace-files/<user-id>/<model-id>/...` in Supabase Storage.
- The public catalog does not show the draft.

- [ ] **Step 7: Final commit**

If any verification-only fixes were needed:

```bash
git add <changed-files>
git commit -m "fix: polish model upload mvp"
```

If no verification fixes were needed, skip this commit.

---

## Self-Review

- Spec coverage: The plan covers bucket creation, storage policies, server-side validation, file upload, metadata persistence, profile UI, localization, unit coverage, e2e smoke coverage, and verification.
- Placeholder scan: No unresolved placeholder or open-ended implementation step remains.
- Type consistency: The action result type, schema field names, form input names, and server action parsing all use `titleUa`, `titleEn`, `descriptionUa`, `descriptionEn`, `categoryId`, `minimumPlan`, and `modelFile`.
- Scope control: Publishing, moderation, cover uploads, subscriptions, download quotas, signed downloads, and public model detail pages remain outside this MVP.
