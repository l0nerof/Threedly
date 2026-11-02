import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  open,
  readFile,
  readdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactsRoot = path.join(root, "test-results", "legacy-rehearsal");
const projectId = "threedly-rehearsal";
const container = `supabase_db_${projectId}`;
const cli = path.join(root, "node_modules", "supabase", "dist", "supabase.js");
const migrationDirectory = path.join(root, "supabase", "migrations");
const firstMigration = "20260415202000_initial_local_marketplace.sql";
const profileColumns = "id,username,avatar_path,bio,created_at,updated_at";
const profileSchema = z.object({
  id: z.guid(),
  username: z.string(),
  avatar_path: z.string().nullable(),
  bio: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
});
const upgradedProfileSchema = profileSchema.extend({
  plan_key: z.enum(["free", "pro", "max"]),
  downloads_limit_monthly: z.number().int(),
  downloads_used_this_month: z.number().int(),
  can_upload: z.boolean(),
});
const signatureSchema = z.object(
  Object.fromEntries(
    [
      "columns",
      "constraints",
      "indexes",
      "rls",
      "functions",
      "policies",
      "triggers",
      "grants",
    ].map((key) => [key, z.array(z.json()).min(1)]),
  ),
);
const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};
const credentials = {
  email: "legacy-rehearsal@threedly.local",
  password: "LocalRehearsal123!",
  username: "legacy_rehearsal",
};
const report = {
  startedAt: new Date().toISOString(),
  projectId,
  status: "running",
  steps: [],
  checks: {},
  limitations: [
    "Synthetic data; no hosted profile, credential or file is exported.",
    "Local service versions may differ from hosted PostgreSQL 17.6.1.063 and hosted Storage; this is not production release approval.",
    "Backup restore uses a separate database in the temporary cluster and an alternate Storage path; it is not a full hosted disaster-recovery exercise.",
  ],
};
const childEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) => !/^(SUPABASE_|NEXT_PUBLIC_SUPABASE_)/.test(key),
  ),
);
let runDirectory;
let ownsStack = false;
let ownsLock = false;
let currentStep = "preflight";
const reservedServers = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function sha(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function redact(value) {
  return String(value)
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[local JWT omitted]",
    )
    .replace(
      /\bsb_(secret|publishable)_[A-Za-z0-9_-]+\b/g,
      "[local key omitted]",
    )
    .replace(/postgres(?:ql)?:\/\/[^\s]+/g, "[local DB URL omitted]")
    .replaceAll(credentials.password, "[synthetic password omitted]");
}
function run(
  command,
  args,
  { input, timeout = 60_000, allowFailure = false } = {},
) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      command,
      args,
      {
        cwd: root,
        env: childEnv,
        windowsHide: true,
        timeout,
        maxBuffer: 32 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const code = error
          ? typeof error.code === "number"
            ? error.code
            : 1
          : 0;
        if (code && !allowFailure)
          reject(
            new Error(
              `${currentStep}: command failed (${code})\n${redact(stderr).slice(-4000)}`,
            ),
          );
        else resolve({ code, stdout, stderr });
      },
    );
    if (input !== undefined) {
      child.stdin.on("error", () => {});
      child.stdin.end(input);
    }
  });
}
function localCli(args, options) {
  const relative = runDirectory
    ? path.relative(artifactsRoot, path.resolve(runDirectory))
    : "";
  assert(
    relative &&
      !path.isAbsolute(relative) &&
      relative.split(path.sep).every((part) => part !== ".."),
    "Unverified rehearsal directory",
  );
  return run(
    process.execPath,
    [cli, ...args, "--workdir", runDirectory],
    options,
  );
}
async function step(name, work) {
  currentStep = name;
  process.stdout.write(`${name}\n`);
  const began = Date.now();
  try {
    const result = await work();
    report.steps.push({ name, ok: true, durationMs: Date.now() - began });
    return result;
  } catch (error) {
    report.steps.push({ name, ok: false, durationMs: Date.now() - began });
    throw error;
  }
}
async function sql(
  query,
  { database = "postgres", allowFailure = false } = {},
) {
  assert(
    ["postgres", "legacy_restore", "canonical_reference"].includes(database),
    "Unexpected database target",
  );
  return run(
    "docker",
    [
      "exec",
      "-i",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      database,
      "-X",
      "-q",
      "-t",
      "-A",
      "-v",
      "ON_ERROR_STOP=1",
      "-v",
      "VERBOSITY=sqlstate",
      "--single-transaction",
    ],
    { input: query, allowFailure },
  );
}
async function sqlJson(query, database = "postgres") {
  const result = await sql(query, { database });
  return z.json().parse(JSON.parse(result.stdout.trim()));
}
async function reservePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  reservedServers.push(server);
  const address = server.address();
  assert(address && typeof address === "object", "Port allocation failed");
  return address.port;
}
async function releasePorts() {
  await Promise.all(
    reservedServers
      .splice(0)
      .map(
        (server) =>
          new Promise((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          ),
      ),
  );
}
async function mainCounts() {
  const state = await run(
    "docker",
    ["inspect", "--format", "{{.State.Running}}", "supabase_db_threedly"],
    { allowFailure: true },
  );
  if (state.code || state.stdout.trim() !== "true") return null;
  const result = await run("docker", [
    "exec",
    "supabase_db_threedly",
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-X",
    "-t",
    "-A",
    "-c",
    "select json_build_object('profiles',(select count(*) from public.profiles),'models',(select count(*) from public.models),'auth_users',(select count(*) from auth.users),'storage_objects',(select count(*) from storage.objects));",
  ]);
  return z
    .record(z.string(), z.number().int())
    .parse(JSON.parse(result.stdout.trim()));
}

const signatureQuery = `select jsonb_build_object(
 'columns',(select jsonb_agg(to_jsonb(x) order by table_name,ordinal_position) from
  (select table_name,ordinal_position,column_name,data_type,udt_name,is_nullable,column_default from information_schema.columns where table_schema='public') x),
 'constraints',(select jsonb_agg(jsonb_build_object('table',c.relname,'name',p.conname,'definition',pg_get_constraintdef(p.oid)) order by c.relname,p.conname) from pg_constraint p join pg_class c on c.oid=p.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'),
 'indexes',(select jsonb_agg(to_jsonb(x) order by tablename,indexname) from (select tablename,indexname,indexdef from pg_indexes where schemaname='public') x),
 'rls',(select jsonb_agg(jsonb_build_object('table',c.relname,'rls',c.relrowsecurity,'force',c.relforcerowsecurity) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'),
 'functions',(select jsonb_agg(jsonb_build_object('name',p.proname,'definition',pg_get_functiondef(p.oid),'acl',p.proacl::text) order by p.proname,pg_get_function_identity_arguments(p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f'),
 'policies',(select jsonb_agg(to_jsonb(x) order by schemaname,tablename,policyname) from (select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname='public' or (schemaname='storage' and tablename='objects')) x),
 'triggers',(select jsonb_agg(pg_get_triggerdef(t.oid) order by n.nspname,c.relname,t.tgname) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and (n.nspname='public' or (n.nspname='auth' and t.tgname='on_auth_user_created'))),
 'grants',(select jsonb_agg(to_jsonb(x) order by table_name,grantee,privilege_type) from (select table_name,grantee,privilege_type,is_grantable from information_schema.role_table_grants where table_schema='public') x)
);`;

async function profile(database = "postgres") {
  return profileSchema.parse(
    await sqlJson(
      `select row_to_json(p) from (select ${profileColumns} from public.profiles where username='${credentials.username}') p;`,
      database,
    ),
  );
}
async function schemaSignature(database = "postgres") {
  return signatureSchema.parse(await sqlJson(signatureQuery, database));
}
function schemaGuard(expected, message) {
  const signature = JSON.stringify(expected).replaceAll("'", "''");
  return `do $rehearsal_guard$ begin
 if (${signatureQuery.trim().replace(/;$/, "")}) is distinct from '${signature}'::jsonb
 then raise exception '${message}'; end if;
end; $rehearsal_guard$;`;
}
async function authFingerprint(database = "postgres") {
  return z
    .object({ id: z.guid(), password: z.string() })
    .parse(
      await sqlJson(
        `select json_build_object('id',id,'password',md5(encrypted_password)) from auth.users where email='${credentials.email}';`,
        database,
      ),
    );
}
async function dump(name) {
  const inside = `/tmp/${name}.dump`;
  await run("docker", [
    "exec",
    container,
    "pg_dump",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-F",
    "c",
    "-n",
    "public",
    "-n",
    "auth",
    "-n",
    "storage",
    "-f",
    inside,
  ]);
  const destination = path.join(runDirectory, `${name}.dump`);
  await run("docker", ["cp", `${container}:${inside}`, destination]);
  return {
    inside,
    path: destination,
    sha256: sha(await readFile(destination)),
  };
}
async function restore(backup, database) {
  assert(
    ["legacy_restore", "canonical_reference"].includes(database),
    "Unexpected restore target",
  );
  await run("docker", [
    "exec",
    container,
    "createdb",
    "-U",
    "supabase_admin",
    "-T",
    "template0",
    "--owner=postgres",
    database,
  ]);
  await run("docker", [
    "exec",
    container,
    "pg_restore",
    "-U",
    "supabase_admin",
    "-d",
    database,
    "--exit-on-error",
    "--clean",
    "--if-exists",
    backup.inside,
  ]);
}

async function main() {
  if (process.argv.slice(2).length)
    throw new Error(
      "Run without flags. This command supports only an isolated synthetic local rehearsal.",
    );
  await mkdir(artifactsRoot, { recursive: true });
  const lockPath = path.join(artifactsRoot, "active.lock");
  const lock = await open(lockPath, "wx");
  ownsLock = true;
  await lock.writeFile(String(process.pid));
  await lock.close();
  runDirectory = path.join(
    artifactsRoot,
    new Date().toISOString().replaceAll(":", "-"),
  );
  await mkdir(runDirectory);
  report.artifacts = path.relative(root, runDirectory);
  try {
    await step("Preflight: existing stacks and source migrations", async () => {
      await run("docker", ["info", "--format", "{{.ServerVersion}}"]);
      for (const args of [
        ["ps", "-a", "--format", "{{.Names}}"],
        ["volume", "ls", "--format", "{{.Name}}"],
      ]) {
        const result = await run("docker", args);
        assert(
          !result.stdout
            .split(/\r?\n/)
            .some((name) => name.endsWith(`_${projectId}`)),
          "A rehearsal container/volume already exists; refusing to adopt or delete it",
        );
      }
      report.mainBefore = await mainCounts();
      report.migrations = (await readdir(migrationDirectory))
        .filter((name) => /^\d{14}_.+\.sql$/.test(name))
        .sort();
      assert(
        report.migrations[0] === firstMigration,
        "Unexpected initial migration; review the bootstrap before running",
      );
      report.migrationHashes = Object.fromEntries(
        await Promise.all(
          report.migrations.map(async (name) => [
            name,
            sha(await readFile(path.join(migrationDirectory, name))),
          ]),
        ),
      );
      report.cliVersion = (
        await run(process.execPath, [cli, "--version"])
      ).stdout.trim();
    });

    const ports = await step(
      "Prepare isolated config and reserve unused ports",
      async () => {
        const ports = [];
        for (let index = 0; index < 5; index += 1)
          ports.push(await reservePort());
        await mkdir(path.join(runDirectory, "supabase", "migrations"), {
          recursive: true,
        });
        await writeFile(
          path.join(runDirectory, "supabase", "config.toml"),
          `project_id = "${projectId}"
[api]
enabled = true
port = ${ports[0]}
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
[db]
port = ${ports[1]}
shadow_port = ${ports[2]}
major_version = 17
[db.migrations]
enabled = true
[db.seed]
enabled = false
[realtime]
enabled = false
[studio]
enabled = false
port = ${ports[3]}
[inbucket]
enabled = true
port = ${ports[4]}
[storage]
enabled = true
file_size_limit = "50MiB"
[auth]
enabled = true
site_url = "http://localhost:3000"
enable_signup = true
[auth.email]
enable_signup = true
enable_confirmations = false
[edge_runtime]
enabled = false
[analytics]
enabled = false
`,
        );
        report.ports = ports;
        return ports;
      },
    );

    await step("Start only the temporary Supabase stack", async () => {
      await releasePorts();
      ownsStack = true;
      await localCli(
        [
          "start",
          "--exclude",
          "studio,postgres-meta,realtime,edge-runtime,logflare,vector,supavisor,imgproxy",
        ],
        { timeout: 300_000 },
      );
    });
    const status = await step(
      "Validate temporary API and record service images",
      async () => {
        const result = await localCli(["status", "--output", "json"]);
        const status = z
          .object({
            API_URL: z.url(),
            ANON_KEY: z.string().min(1),
            SERVICE_ROLE_KEY: z.string().min(1),
          })
          .parse(JSON.parse(result.stdout));
        const url = new URL(status.API_URL);
        assert(
          url.protocol === "http:" &&
            ["127.0.0.1", "localhost"].includes(url.hostname) &&
            url.port === String(ports[0]) &&
            !url.username &&
            !url.password,
          "API is outside the allocated local rehearsal target",
        );
        report.serviceImages = {};
        for (const service of ["db", "auth", "storage"])
          report.serviceImages[service] = (
            await run("docker", [
              "inspect",
              "--format",
              "{{.Config.Image}}",
              `supabase_${service}_${projectId}`,
            ])
          ).stdout.trim();
        return status;
      },
    );
    const admin = createClient(
      status.API_URL,
      status.SERVICE_ROLE_KEY,
      clientOptions,
    );
    const publicClient = createClient(
      status.API_URL,
      status.ANON_KEY,
      clientOptions,
    );
    const initialSql = await readFile(
      path.join(migrationDirectory, firstMigration),
      "utf8",
    );
    const managedBaseline = await step(
      "Back up empty managed schemas for an independent canonical reference",
      () => dump("managed-empty"),
    );
    await step("Recreate verified legacy schema", async () => {
      await sql(
        await readFile(
          path.join(root, "supabase", "rehearsal", "legacy-schema.sql"),
          "utf8",
        ),
      );
      await sql("notify pgrst, 'reload schema';");
    });
    const avatar = await readFile(path.join(root, "public", "logo.png"));
    let ownerId;
    let avatarPath;
    async function publicAvatarHash() {
      const { data } = publicClient.storage
        .from("avatars")
        .getPublicUrl(avatarPath);
      assert(
        new URL(data.publicUrl).origin === new URL(status.API_URL).origin,
        "Unexpected avatar origin",
      );
      const response = await fetch(data.publicUrl, {
        signal: AbortSignal.timeout(10_000),
        redirect: "error",
        cache: "no-store",
      });
      assert(response.ok, "Public legacy avatar is unavailable");
      return sha(Buffer.from(await response.arrayBuffer()));
    }
    await step(
      "Create synthetic legacy account, profile and real avatar",
      async () => {
        const created = await admin.auth.admin.createUser({
          email: credentials.email,
          password: credentials.password,
          email_confirm: true,
          user_metadata: { username: credentials.username },
        });
        assert(
          !created.error && created.data.user,
          "Synthetic Auth signup failed",
        );
        ownerId = z.guid().parse(created.data.user.id);
        avatarPath = `${ownerId}/legacy-avatar.png`;
        const uploaded = await admin.storage
          .from("avatars")
          .upload(avatarPath, avatar, {
            contentType: "image/png",
            upsert: false,
          });
        assert(!uploaded.error, "Synthetic avatar upload failed");
        const deadline = Date.now() + 15_000;
        for (;;) {
          const updated = await admin
            .from("profiles")
            .update({
              avatar_path: avatarPath,
              bio: "Legacy rehearsal — Україна",
            })
            .eq("id", ownerId)
            .select("id")
            .single();
          if (!updated.error) break;
          assert(
            ["PGRST204", "PGRST205"].includes(updated.error.code) &&
              Date.now() < deadline,
            "Legacy profile API is not available after schema reload",
          );
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        assert(
          (await publicAvatarHash()) === sha(avatar),
          "Legacy public avatar bytes differ",
        );
      },
    );
    const beforeProfile = await profile();
    const beforeAuth = await authFingerprint();
    const beforeSchema = await schemaSignature();
    const legacyBackup = await step(
      "Back up legacy DB schemas/data and avatar bytes",
      async () => {
        const backup = await dump("legacy");
        await writeFile(path.join(runDirectory, "legacy-avatar.png"), avatar);
        report.backup = {
          database: path.basename(backup.path),
          sha256: backup.sha256,
          avatar: "legacy-avatar.png",
          avatarSha256: sha(avatar),
        };
        return backup;
      },
    );
    await step(
      "Restore the backup into another temporary database and restore avatar bytes through Storage API",
      async () => {
        await restore(legacyBackup, "legacy_restore");
        assert(
          isDeepStrictEqual(await profile("legacy_restore"), beforeProfile),
          "Restored legacy profile differs",
        );
        assert(
          isDeepStrictEqual(
            await authFingerprint("legacy_restore"),
            beforeAuth,
          ),
          "Restored Auth credentials differ",
        );
        assert(
          isDeepStrictEqual(
            await schemaSignature("legacy_restore"),
            beforeSchema,
          ),
          "Restored legacy schema/permissions differ",
        );
        const restoredObjects = await sqlJson(
          "select count(*) from storage.objects where bucket_id='avatars';",
          "legacy_restore",
        );
        assert(restoredObjects === 1, "Restored avatar metadata differs");
        const restoredBytes = await readFile(
          path.join(runDirectory, "legacy-avatar.png"),
        );
        const restorePath = `${ownerId}/restore-check.png`;
        const uploaded = await admin.storage
          .from("avatars")
          .upload(restorePath, restoredBytes, {
            contentType: "image/png",
            upsert: false,
          });
        assert(!uploaded.error, "Avatar restore upload failed");
        const downloaded = await admin.storage
          .from("avatars")
          .download(restorePath);
        assert(
          !downloaded.error &&
            downloaded.data &&
            sha(Buffer.from(await downloaded.data.arrayBuffer())) ===
              sha(avatar),
          "Restored avatar bytes differ",
        );
        const removed = await admin.storage
          .from("avatars")
          .remove([restorePath]);
        assert(!removed.error, "Temporary restore-check object cleanup failed");
        report.checks.backupRestore = true;
      },
    );
    async function unchangedLegacy() {
      assert(
        isDeepStrictEqual(await profile(), beforeProfile),
        "Rollback changed legacy profile",
      );
      assert(
        isDeepStrictEqual(await authFingerprint(), beforeAuth),
        "Rollback changed Auth credentials",
      );
      assert(
        isDeepStrictEqual(await schemaSignature(), beforeSchema),
        "Rollback changed legacy schema/permissions",
      );
      assert(
        (await publicAvatarHash()) === sha(avatar),
        "Rollback changed avatar bytes",
      );
    }
    await step(
      "Confirm unmodified initial migration rejects the existing profiles table and rolls back",
      async () => {
        const result = await sql(initialSql, { allowFailure: true });
        assert(
          result.code !== 0 && result.stderr.includes("42P07"),
          "Expected the existing-table migration conflict",
        );
        await unchangedLegacy();
        report.checks.naiveMigrationConflict = true;
      },
    );

    await step(
      "Apply original initial migration to an independent fresh canonical reference",
      async () => {
        await restore(managedBaseline, "canonical_reference");
        await sql(
          "create schema if not exists extensions; create extension if not exists pgcrypto with schema extensions;",
          { database: "canonical_reference" },
        );
        await sql(initialSql, { database: "canonical_reference" });
      },
    );
    const expectedBaseline = await schemaSignature("canonical_reference");
    const bootstrap = `${schemaGuard(beforeSchema, "Legacy schema drift; review before upgrading")}
do $history_guard$ declare applied_count bigint; begin
 if to_regclass('supabase_migrations.schema_migrations') is not null then
  execute 'select count(*) from supabase_migrations.schema_migrations' into applied_count;
  if applied_count <> 0 then raise exception 'Expected empty migration history'; end if;
 end if;
end; $history_guard$;
create temporary table legacy_profile_copy on commit drop as select ${profileColumns} from public.profiles;
drop function public.is_username_available(text);
drop table public.profiles;
drop policy avatars_select_public on storage.objects;
drop policy avatars_insert_own on storage.objects;
drop policy avatars_update_own on storage.objects;
drop policy avatars_delete_own on storage.objects;
${initialSql}
insert into public.profiles (${profileColumns}) select ${profileColumns} from legacy_profile_copy;
do $$ begin
 if exists ((select ${profileColumns} from legacy_profile_copy except select ${profileColumns} from public.profiles)
 union all (select ${profileColumns} from public.profiles except select ${profileColumns} from legacy_profile_copy))
 then raise exception 'Legacy profile preservation failed'; end if;
end; $$;
${schemaGuard(expectedBaseline, "Canonical baseline mismatch; upgrade rolled back")}`;
    await writeFile(path.join(runDirectory, "review-bootstrap.sql"), bootstrap);
    await step("Reject schema drift and incompatible legacy data", async () => {
      for (const [change, code] of [
        [
          "alter table public.profiles add column unexpected_column text;",
          "P0001",
        ],
        ["update public.profiles set username='bad name';", "23514"],
      ]) {
        const result = await sql(`${change}\n${bootstrap}`, {
          allowFailure: true,
        });
        assert(
          result.code !== 0 && result.stderr.includes(code),
          `Expected rejected legacy change (${code})`,
        );
        await unchangedLegacy();
      }
      report.checks.schemaDriftAndInvalidDataRejected = true;
    });
    await step(
      "Force a mid-upgrade failure and prove transaction rollback",
      async () => {
        const result = await sql(`${bootstrap}\nselect 1/0;`, {
          allowFailure: true,
        });
        assert(
          result.code !== 0 && result.stderr.includes("22012"),
          "Expected deliberate division-by-zero rollback",
        );
        await unchangedLegacy();
        report.checks.forcedRollback = true;
      },
    );
    await step(
      "Bootstrap legacy profiles atomically and compare with the fresh canonical baseline",
      async () => {
        await sql(bootstrap);
        assert(
          isDeepStrictEqual(await profile(), beforeProfile),
          "Bootstrap changed original profile fields",
        );
        const expected = expectedBaseline;
        const actual = await schemaSignature();
        await writeFile(
          path.join(runDirectory, "canonical-baseline.json"),
          JSON.stringify(expected, null, 2),
        );
        await writeFile(
          path.join(runDirectory, "adopted-baseline.json"),
          JSON.stringify(actual, null, 2),
        );
        assert(
          isDeepStrictEqual(actual, expected),
          `Canonical baseline differs: ${Object.keys(expected)
            .filter((key) => !isDeepStrictEqual(expected[key], actual[key]))
            .join(", ")}`,
        );
        assert(
          (await publicAvatarHash()) === sha(avatar),
          "Bootstrap changed avatar bytes",
        );
        report.checks.canonicalBaselineEquivalent = true;
      },
    );
    await step(
      "Record only the verified baseline and apply remaining original migrations locally",
      async () => {
        for (const file of report.migrations)
          await copyFile(
            path.join(migrationDirectory, file),
            path.join(runDirectory, "supabase", "migrations", file),
          );
        await localCli([
          "migration",
          "repair",
          firstMigration.slice(0, 14),
          "--status",
          "applied",
          "--local",
        ]);
        const pushed = await localCli(["db", "push", "--local", "--yes"], {
          timeout: 120_000,
        });
        await writeFile(
          path.join(runDirectory, "migration-push.log"),
          redact(pushed.stdout + pushed.stderr),
        );
        const versions = z
          .array(z.string())
          .parse(
            await sqlJson(
              "select json_agg(version order by version) from supabase_migrations.schema_migrations;",
            ),
          );
        assert(
          isDeepStrictEqual(
            versions,
            report.migrations.map((file) => file.slice(0, 14)),
          ),
          "Migration history differs from repository files",
        );
        report.checks.migrationHistory = versions;
        await sql("notify pgrst, 'reload schema';");
      },
    );
    await step(
      "Verify legacy data, old login, new signup, permissions and avatar after all migrations",
      async () => {
        const upgraded = upgradedProfileSchema.parse(
          await sqlJson(
            `select row_to_json(p) from (select ${profileColumns},plan_key,downloads_limit_monthly,downloads_used_this_month,can_upload from public.profiles where username='${credentials.username}') p;`,
          ),
        );
        const { updated_at: originalUpdated, ...originalStable } =
          beforeProfile;
        const { updated_at: migratedUpdated, ...migratedStable } =
          profileSchema.parse(upgraded);
        assert(
          isDeepStrictEqual(originalStable, migratedStable),
          "Upgrade changed legacy identity/content/created timestamp",
        );
        assert(
          Date.parse(migratedUpdated) >= Date.parse(originalUpdated),
          "Profile update timestamp moved backwards",
        );
        assert(
          upgraded.plan_key === "free" &&
            upgraded.downloads_limit_monthly === 5 &&
            upgraded.downloads_used_this_month === 0 &&
            !upgraded.can_upload,
          "Unexpected legacy account beta defaults",
        );
        assert(
          isDeepStrictEqual(await authFingerprint(), beforeAuth),
          "Upgrade changed Auth identity/password hash",
        );
        const signed = await publicClient.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        assert(
          !signed.error && signed.data.user?.id === ownerId,
          "Existing password no longer authenticates the original user",
        );
        const deadline = Date.now() + 15_000;
        for (;;) {
          const result = await publicClient
            .from("profiles")
            .select("id,username,plan_key,downloads_limit_monthly,can_upload")
            .eq("id", ownerId)
            .single();
          if (!result.error) {
            assert(
              result.data.id === ownerId && result.data.plan_key === "free",
              "Owner profile read failed",
            );
            break;
          }
          assert(
            ["PGRST204", "PGRST205"].includes(result.error.code) &&
              Date.now() < deadline,
            "Upgraded profile API is not available",
          );
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        const forbidden = await publicClient
          .from("profiles")
          .update({ plan_key: "max" })
          .eq("id", ownerId);
        assert(
          forbidden.error?.code === "42501",
          "Owner could modify the administrative plan",
        );
        assert(
          (await publicAvatarHash()) === sha(avatar),
          "Upgrade changed legacy public avatar bytes",
        );
        const fresh = await admin.auth.admin.createUser({
          email: "new-rehearsal@threedly.local",
          password: credentials.password,
          email_confirm: true,
          user_metadata: {
            username: "rehearsal_new",
            plan_key: "max",
            can_upload: true,
          },
        });
        assert(
          !fresh.error && fresh.data.user,
          "Post-upgrade signup trigger failed",
        );
        const freshProfile = await sqlJson(
          "select json_build_object('plan',plan_key,'limit',downloads_limit_monthly,'upload',can_upload) from public.profiles where username='rehearsal_new';",
        );
        assert(
          isDeepStrictEqual(freshProfile, {
            plan: "free",
            limit: 5,
            upload: false,
          }),
          "Signup metadata escalated permissions",
        );
        report.checks.dataAndAuthPreserved = true;
        report.checks.avatarBytesPreserved = true;
        report.checks.newSignupAndPlanProtection = true;
        report.profileTimestamp =
          "Initial bootstrap preserves both timestamps; existing quota backfill may advance updated_at.";
        await publicClient.auth.signOut({ scope: "global" });
      },
    );
    await step(
      "Run the existing pgTAP database suite against only the rehearsal stack",
      async () => {
        const testsDirectory = path.join(
          runDirectory,
          "supabase",
          "tests",
          "database",
        );
        await mkdir(testsDirectory, { recursive: true });
        for (const file of await readdir(
          path.join(root, "supabase", "tests", "database"),
        ))
          if (file.endsWith(".sql"))
            await copyFile(
              path.join(root, "supabase", "tests", "database", file),
              path.join(testsDirectory, file),
            );
        const result = await localCli(["test", "db", "--local"], {
          timeout: 180_000,
        });
        const log = redact(result.stdout + result.stderr);
        await writeFile(path.join(runDirectory, "database-tests.log"), log);
        assert(log.includes("Result: PASS"), "pgTAP did not report PASS");
        const counts = log.match(/Files=(\d+), Tests=(\d+)/);
        report.databaseTests = {
          passed: true,
          files: counts ? Number(counts[1]) : null,
          tests: counts ? Number(counts[2]) : null,
        };
      },
    );
    await step(
      "Verify no repository migration or main local row count changed",
      async () => {
        for (const file of report.migrations)
          assert(
            sha(await readFile(path.join(migrationDirectory, file))) ===
              report.migrationHashes[file],
            "Repository migration changed during rehearsal",
          );
        report.mainAfter = await mainCounts();
        assert(
          isDeepStrictEqual(report.mainBefore, report.mainAfter),
          "Main local counts changed during rehearsal; inspect concurrent activity",
        );
        report.checks.mainCountsPreserved = true;
      },
    );
    report.status = "passed";
  } catch (error) {
    report.status = "failed";
    report.error = redact(
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    await releasePorts();
    if (ownsStack) {
      try {
        const config = await readFile(
          path.join(runDirectory, "supabase", "config.toml"),
          "utf8",
        );
        assert(
          config.startsWith(`project_id = "${projectId}"\n`),
          "Refusing cleanup of an unverified project",
        );
        await localCli(["stop", "--project-id", projectId, "--no-backup"], {
          timeout: 120_000,
        });
        report.temporaryStackRemoved = true;
      } catch (error) {
        report.status = "failed";
        report.cleanupError = redact(
          error instanceof Error ? error.message : String(error),
        );
      }
    }
    report.finishedAt = new Date().toISOString();
    await writeFile(
      path.join(runDirectory, "report.json"),
      JSON.stringify(report, null, 2),
    );
    if (ownsLock) {
      await unlink(lockPath);
      ownsLock = false;
    }
  }
  process.stdout.write(
    `Rehearsal ${report.status}. Report: ${path.join(runDirectory, "report.json")}\n`,
  );
  if (report.status !== "passed") {
    process.stderr.write(`${report.error ?? report.cleanupError}\n`);
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  await releasePorts();
  if (ownsLock)
    await unlink(path.join(artifactsRoot, "active.lock")).catch(() => {});
  process.stderr.write(
    `${redact(error instanceof Error ? error.message : String(error))}\n`,
  );
  process.exitCode = 1;
});
