import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import {
  publicationDraftRowSchema,
  publicationRpcSchema,
} from "../../src/business/schemas/modelPublication";
import type { Database } from "../../src/business/types/database.generated";
import { publicationFixture } from "./model-publication";

const idSchema = z.guid();
const statusSchema = z.object({
  API_URL: z.url().refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "http:" &&
      ["127.0.0.1", "localhost"].includes(url.hostname) &&
      url.port === "54321" &&
      !url.username &&
      !url.password
    );
  }),
  SERVICE_ROLE_KEY: z.string().min(1),
  ANON_KEY: z.string().min(1),
  MAILPIT_URL: z.url().refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "http:" &&
      ["127.0.0.1", "localhost"].includes(url.hostname) &&
      url.port === "54324" &&
      !url.username &&
      !url.password
    );
  }),
});
const modelSchema = z.object({
  id: idSchema,
  slug: z.string().min(1),
  title_ua: z.string().min(1),
  cover_image_path: z.string(),
});
const privateAssetSchema = z.object({
  object_path: z.string().min(1),
  kind: z.enum(["source", "cover"]),
});
const profileSchema = z.object({
  plan_key: z.enum(["free", "pro", "max"]),
  can_upload: z.boolean(),
  downloads_limit_monthly: z.number().int(),
});
const ownerProfileSchema = z.object({
  username: z.string(),
  bio: z.string().nullable(),
  avatar_path: z.string().nullable(),
});
const avatarObjectSchema = z.object({
  id: idSchema,
  name: z
    .string()
    .regex(/^[^/\\]+$/)
    .refine((name) => name !== "." && name !== ".."),
});
const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};
const testPassword = "LocalAccessE2E123!";

export async function readLocalStatus() {
  try {
    const { stdout } = await promisify(execFile)(
      process.execPath,
      [
        resolve("node_modules/supabase/dist/supabase.js"),
        "status",
        "--output",
        "json",
      ],
      { timeout: 20_000, windowsHide: true },
    );
    const value: unknown = JSON.parse(stdout);
    return statusSchema.parse(value);
  } catch {
    throw new Error(
      "Cannot read verified local Supabase configuration; credentials omitted. Start the local stack first.",
    );
  }
}

export async function createLocalMarketplace() {
  const status = await readLocalStatus();
  const admin = createClient<Database>(
    status.API_URL,
    status.SERVICE_ROLE_KEY,
    clientOptions,
  );
  const createdUsers: string[] = [];
  const sessions: string[] = [];
  const objects: { bucket: string; path: string }[] = [];
  const clients = new Map<string, ReturnType<typeof createClient<Database>>>();

  async function avatarPaths(userId: string) {
    if (!createdUsers.includes(userId))
      throw new Error("Avatar discovery is limited to this test's accounts");
    const paths: string[] = [];
    for (let offset = 0; ; offset += 100) {
      const result = await admin.storage.from("avatars").list(userId, {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (result.error) throw new Error("Could not discover isolated avatars");
      const rows = z.array(avatarObjectSchema).parse(result.data);
      paths.push(...rows.map((row) => `${userId}/${row.name}`));
      if (rows.length < 100) return paths;
    }
  }

  async function createAccount(role: "owner" | "reader" | "other") {
    const email = `e2e-access-${role}@threedly.local`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: testPassword,
      email_confirm: true,
      user_metadata: { username: `e2e_access_${role}` },
    });
    if (error || !data.user)
      throw new Error(
        `Could not create isolated ${role} account; existing accounts are never reused or deleted.`,
      );
    const id = idSchema.parse(data.user.id);
    createdUsers.push(id);
    if (role !== "reader") {
      const result = await admin
        .from("profiles")
        .update({
          plan_key: "pro",
          can_upload: true,
          downloads_limit_monthly: 25,
        })
        .eq("id", id);
      if (result.error) throw new Error(`Could not configure ${role} profile.`);
    }
    const client = createClient<Database>(
      status.API_URL,
      status.ANON_KEY,
      clientOptions,
    );
    const signed = await client.auth.signInWithPassword({
      email,
      password: testPassword,
    });
    if (signed.error || !signed.data.session)
      throw new Error(`Could not verify isolated ${role} session.`);
    sessions.push(signed.data.session.access_token);
    clients.set(id, client);
    return { id, email, password: testPassword };
  }

  async function dispose() {
    if (!createdUsers.length) return;
    const failures: string[] = [];
    async function attempt(name: string, work: () => Promise<void>) {
      try {
        await work();
      } catch {
        failures.push(name);
      }
    }
    await attempt("private asset discovery", async () => {
      const drafts = await admin
        .from("model_publication_drafts")
        .select("id")
        .in("creator_id", createdUsers);
      if (drafts.error) throw new Error("Draft discovery failed");
      const ids = z
        .array(z.object({ id: idSchema }))
        .parse(drafts.data)
        .map((row) => row.id);
      if (!ids.length) return;
      const assets = await admin
        .from("model_publication_assets")
        .select("object_path, kind")
        .in("draft_id", ids);
      if (assets.error) throw new Error("Asset discovery failed");
      for (const asset of z.array(privateAssetSchema).parse(assets.data))
        objects.push({
          bucket:
            asset.kind === "source"
              ? "model-draft-files"
              : "model-draft-images",
          path: asset.object_path,
        });
    });
    await attempt("published asset discovery", async () => {
      const rows = await admin
        .from("models")
        .select("id, slug, title_ua, cover_image_path")
        .in("creator_id", createdUsers);
      if (rows.error) throw new Error("Model discovery failed");
      const models = z.array(modelSchema).parse(rows.data);
      if (!models.length) return;
      const files = await admin
        .from("model_files")
        .select("bucket, object_path")
        .in(
          "model_id",
          models.map((model) => model.id),
        );
      if (files.error) throw new Error("File discovery failed");
      for (const file of z
        .array(z.object({ bucket: z.string(), object_path: z.string() }))
        .parse(files.data))
        objects.push({ bucket: file.bucket, path: file.object_path });
      for (const model of models) {
        const prefix = `${status.API_URL}/storage/v1/object/public/model-images/`;
        if (model.cover_image_path.startsWith(prefix))
          objects.push({
            bucket: "model-images",
            path: decodeURIComponent(
              model.cover_image_path.slice(prefix.length),
            ),
          });
        else if (
          createdUsers.some((id) => model.cover_image_path.startsWith(`${id}/`))
        )
          objects.push({
            bucket: "model-images",
            path: model.cover_image_path,
          });
      }
    });
    await attempt("avatar discovery", async () => {
      for (const id of createdUsers)
        for (const path of await avatarPaths(id))
          objects.push({ bucket: "avatars", path });
    });
    for (const bucket of [
      "avatars",
      "models",
      "model-images",
      "model-draft-files",
      "model-draft-images",
    ]) {
      await attempt(`${bucket} cleanup`, async () => {
        const paths = [
          ...new Set(
            objects
              .filter((object) => object.bucket === bucket)
              .map((object) => object.path),
          ),
        ];
        if (!paths.length) return;
        if (
          paths.some(
            (path) => !createdUsers.some((id) => path.startsWith(`${id}/`)),
          )
        )
          throw new Error("Cleanup path is outside created users");
        const { error } = await admin.storage.from(bucket).remove(paths);
        if (error) throw new Error("Storage cleanup failed");
      });
    }
    await attempt("avatar cleanup verification", async () => {
      for (const id of createdUsers)
        if ((await avatarPaths(id)).length)
          throw new Error("Isolated avatars remain");
    });
    await attempt("model metadata cleanup", async () => {
      const { error } = await admin
        .from("models")
        .delete()
        .in("creator_id", createdUsers);
      if (error) throw new Error("Model cleanup failed");
    });
    for (const token of sessions)
      await attempt("session revocation", async () => {
        const { error } = await admin.auth.admin.signOut(token, "global");
        if (
          error &&
          error.status !== 401 &&
          error.status !== 403 &&
          error.status !== 404
        )
          throw new Error("Session revocation failed");
      });
    for (const id of createdUsers)
      await attempt(`account ${id} cleanup`, async () => {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) throw new Error("Account cleanup failed");
      });
    await attempt("profile cleanup verification", async () => {
      const rows = await admin
        .from("profiles")
        .select("id")
        .in("id", createdUsers);
      if (
        rows.error ||
        z.array(z.object({ id: idSchema })).parse(rows.data).length
      )
        throw new Error("Profiles remain");
    });
    if (failures.length)
      throw new Error(
        `Local test cleanup failed: ${failures.join(", ")}. Created user IDs: ${createdUsers.join(", ")}`,
      );
  }

  try {
    const owner = await createAccount("owner");
    const reader = await createAccount("reader");
    const other = await createAccount("other");

    async function createModel(
      plan: Database["public"]["Enums"]["plan_key"],
      key: string,
    ) {
      const category = await admin
        .from("categories")
        .select("id")
        .eq("slug", "chairs")
        .single();
      if (category.error)
        throw new Error("Seeded chairs category is unavailable");
      const categoryId = z.object({ id: idSchema }).parse(category.data).id;
      const created = await admin
        .from("models")
        .insert({
          creator_id: owner.id,
          category_id: categoryId,
          slug: `e2e-access-${key}`,
          title_ua: `E2E access ${key}`,
          title_en: `E2E access ${key}`,
          status: "published",
          minimum_plan: plan,
          cover_image_path: "/logo.png",
          file_format: "obj",
          file_size_bytes: publicationFixture.source.buffer.length,
          published_at: "2026-01-01T00:00:00.000Z",
        })
        .select("id, slug, title_ua, cover_image_path")
        .single();
      if (created.error)
        throw new Error(`Could not create isolated ${key} model`);
      const model = modelSchema.parse(created.data);
      const path = `${owner.id}/${model.id}/${publicationFixture.source.name}`;
      objects.push({ bucket: "models", path });
      const uploaded = await admin.storage
        .from("models")
        .upload(path, publicationFixture.source.buffer, {
          contentType: "application/octet-stream",
          upsert: false,
        });
      if (uploaded.error)
        throw new Error(`Could not upload isolated ${key} source`);
      const file = await admin.from("model_files").insert({
        model_id: model.id,
        storage_provider: "supabase",
        bucket: "models",
        object_path: path,
        file_name: publicationFixture.source.name,
        file_size_bytes: publicationFixture.source.buffer.length,
        format: "obj",
        is_primary: true,
      });
      if (file.error)
        throw new Error(`Could not register isolated ${key} source`);
      return model;
    }

    async function readerState() {
      const profile = await admin
        .from("profiles")
        .select("plan_key, can_upload, downloads_limit_monthly")
        .eq("id", reader.id)
        .single();
      const downloads = await admin
        .from("downloads")
        .select("model_id")
        .eq("user_id", reader.id);
      if (profile.error || downloads.error)
        throw new Error("Could not read isolated reader state");
      return {
        ...profileSchema.parse(profile.data),
        downloads: z
          .array(z.object({ model_id: idSchema.nullable() }))
          .parse(downloads.data),
      };
    }

    async function ownedDraftAssets(draftId: string) {
      const draft = await admin
        .from("model_publication_drafts")
        .select("id")
        .eq("id", idSchema.parse(draftId))
        .eq("creator_id", owner.id)
        .single();
      if (draft.error)
        throw new Error("Draft does not belong to this test owner");
      const rows = await admin
        .from("model_publication_assets")
        .select("object_path, kind")
        .eq("draft_id", draftId)
        .eq("state", "active")
        .order("kind", { ascending: true });
      if (rows.error) throw new Error("Could not read isolated draft assets");
      return z.array(privateAssetSchema).parse(rows.data);
    }

    return {
      owner,
      reader,
      other,
      createModel,
      readerState,
      ownedDraftAssets,
      dispose,
      async ownerProfile() {
        const result = await admin
          .from("profiles")
          .select("username, bio, avatar_path")
          .eq("id", owner.id)
          .single();
        if (result.error)
          throw new Error("Could not read isolated owner profile");
        return ownerProfileSchema.parse(result.data);
      },
      ownerAvatarPaths: () => avatarPaths(owner.id),
      async ownerAvatarBytes(path: string) {
        if (!(await avatarPaths(owner.id)).includes(path))
          throw new Error("Only this test's owned avatars may be read");
        const result = await admin.storage.from("avatars").download(path);
        if (result.error || !result.data)
          throw new Error("Could not read isolated avatar bytes");
        return Buffer.from(await result.data.arrayBuffer());
      },
      async ownedDraftStates() {
        const rows = await admin
          .from("model_publication_drafts")
          .select("*")
          .eq("creator_id", owner.id)
          .order("created_at", { ascending: true });
        if (rows.error) throw new Error("Could not inspect this test's drafts");
        return z.array(publicationDraftRowSchema).parse(rows.data);
      },
      async ownedDraftState(draftId: string) {
        const row = await admin
          .from("model_publication_drafts")
          .select("*")
          .eq("id", idSchema.parse(draftId))
          .eq("creator_id", owner.id)
          .single();
        if (row.error) throw new Error("Could not inspect this test's draft");
        return publicationDraftRowSchema.parse(row.data);
      },
      async preparePublication(draftId: string) {
        const row = await admin
          .from("model_publication_drafts")
          .select("*")
          .eq("id", idSchema.parse(draftId))
          .eq("creator_id", owner.id)
          .single();
        if (row.error) throw new Error("Cannot prepare another owner's draft");
        const draft = publicationDraftRowSchema.parse(row.data);
        const client = clients.get(owner.id);
        if (!client) throw new Error("Isolated owner session is missing");
        const result = await client
          .rpc("manage_publication_draft", {
            requested_draft_id: draft.id,
            requested_operation: "prepare_publish",
            requested_revision: draft.revision,
          })
          .single();
        if (result.error)
          throw new Error("Real publication preparation failed");
        const prepared = publicationRpcSchema.parse(result.data);
        if (
          prepared.result !== "ok" ||
          prepared.lifecycle !== "publishing" ||
          !prepared.model_id
        )
          throw new Error("Publication did not enter its frozen state");
        for (const asset of prepared.assets) {
          if (!asset.destinationBucket || !asset.destinationPath)
            throw new Error("Publication destination is missing");
          objects.push({
            bucket: asset.destinationBucket,
            path: asset.destinationPath,
          });
        }
        return prepared;
      },
      async publishedModels() {
        const rows = await admin
          .from("models")
          .select("id, slug, title_ua, cover_image_path")
          .eq("creator_id", owner.id);
        if (rows.error)
          throw new Error("Could not inspect this test's publications");
        return z.array(modelSchema).parse(rows.data);
      },
      async revokeUpload() {
        const { error } = await admin
          .from("profiles")
          .update({ can_upload: false })
          .eq("id", owner.id);
        if (error)
          throw new Error("Could not revoke isolated creator permission");
      },
      async publishedModelCount() {
        const result = await admin
          .from("models")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", owner.id);
        if (result.error || result.count === null)
          throw new Error("Could not count isolated models");
        return result.count;
      },
      async readPrivateAsset(
        userId: string,
        asset: z.infer<typeof privateAssetSchema>,
      ) {
        const client = clients.get(userId);
        if (!client)
          throw new Error(
            "Only this test's authenticated clients may read assets",
          );
        return client.storage
          .from(
            asset.kind === "source"
              ? "model-draft-files"
              : "model-draft-images",
          )
          .download(asset.object_path);
      },
    };
  } catch (error) {
    await dispose();
    throw error;
  }
}

export type LocalMarketplace = Awaited<
  ReturnType<typeof createLocalMarketplace>
>;
export type AccessModel = Awaited<ReturnType<LocalMarketplace["createModel"]>>;
