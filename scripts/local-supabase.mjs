import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  DEMO_USER_USERNAME,
} from "./demo-user-credentials.mjs";

process.noDeprecation = true;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const binDir = path.join(repoRoot, "node_modules", ".bin");
const supabaseBin = path.join(
  binDir,
  process.platform === "win32" ? "supabase.cmd" : "supabase",
);
const nextBin = path.join(
  binDir,
  process.platform === "win32" ? "next.cmd" : "next",
);
const demoUserEnvPath = path.join(repoRoot, ".env.demo-user.local");
const postSeedScriptPath = path.join(
  repoRoot,
  "scripts",
  "post-seed-demo-user.mjs",
);
const seedFiles = [
  path.join(repoRoot, "supabase", "seeds", "01_categories.sql"),
  path.join(repoRoot, "supabase", "seeds", "02_models.sql"),
  path.join(repoRoot, "supabase", "seeds", "03_model_files.sql"),
];

function hasLocalSupabaseStatus(status) {
  return Boolean(
    status?.apiUrl && status.publishableKey && status.serviceRoleKey,
  );
}

function runCommand(command, args, options = {}) {
  const { capture = false, env = process.env } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env,
      shell:
        process.platform === "win32" && command.toLowerCase().endsWith(".cmd"),
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    let stdout = "";
    let stderr = "";

    if (capture) {
      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          capture && stderr.trim()
            ? stderr.trim()
            : `${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`,
        ),
      );
    });
  });
}

async function getSupabaseStatus() {
  try {
    const { stdout } = await runCommand(
      supabaseBin,
      ["status", "--output", "json"],
      { capture: true },
    );

    const parsed = JSON.parse(stdout);

    return {
      apiUrl:
        parsed.API_URL ??
        parsed.api_url ??
        parsed.apiUrl ??
        parsed.api?.url ??
        null,
      publishableKey:
        parsed.PUBLISHABLE_KEY ??
        parsed.ANON_KEY ??
        parsed.publishable_key ??
        parsed.anon_key ??
        parsed.publishableKey ??
        parsed.anonKey ??
        null,
      serviceRoleKey:
        parsed.SERVICE_ROLE_KEY ??
        parsed.service_role_key ??
        parsed.serviceRoleKey ??
        null,
      dbUrl: parsed.DB_URL ?? parsed.db_url ?? parsed.dbUrl ?? null,
      studioUrl:
        parsed.STUDIO_URL ?? parsed.studio_url ?? parsed.studioUrl ?? null,
    };
  } catch {
    return null;
  }
}

function stringifyEnvEntries(entries) {
  return `${entries.map(([key, value]) => `${key}=${value}`).join("\n")}\n`;
}

async function writeLocalSupportFiles() {
  const demoUserEntries = [
    ["THREEDLY_DEMO_USER_EMAIL", DEMO_USER_EMAIL],
    ["THREEDLY_DEMO_USER_PASSWORD", DEMO_USER_PASSWORD],
    ["THREEDLY_DEMO_USER_USERNAME", DEMO_USER_USERNAME],
  ];

  await writeFile(
    demoUserEnvPath,
    stringifyEnvEntries(demoUserEntries),
    "utf8",
  );
}

function printLocalAccessSummary(status) {
  const relativeDemoUserEnvPath = path.relative(repoRoot, demoUserEnvPath);

  console.log("");
  console.log("Threedly local development is ready:");
  console.log(`- Supabase Studio: ${status.studioUrl ?? "not available"}`);
  console.log(`- Local Supabase API: ${status.apiUrl}`);

  if (status.dbUrl) {
    console.log(`- Local Postgres: ${status.dbUrl}`);
  }

  console.log(`- Demo user credentials: ${relativeDemoUserEnvPath}`);
  console.log(`  email: ${DEMO_USER_EMAIL}`);
  console.log(`  password: ${DEMO_USER_PASSWORD}`);
  console.log("");
}

function printRemoteAccessSummary() {
  console.log("");
  console.log("Threedly remote development mode:");
  console.log("- Frontend uses Supabase credentials from .env.local");
  console.log("- Local Supabase containers are not started automatically");
  console.log("");
}

async function ensureSupabaseStarted() {
  let status = await getSupabaseStatus();

  if (!hasLocalSupabaseStatus(status)) {
    await runCommand(supabaseBin, ["start", "--yes"]);
    status = await getSupabaseStatus();
  }

  if (!hasLocalSupabaseStatus(status)) {
    throw new Error(
      "Supabase started, but local credentials were not available from `supabase status`.",
    );
  }

  await writeLocalSupportFiles();
  return status;
}

async function requireRunningSupabase(commandName) {
  const status = await getSupabaseStatus();

  if (!hasLocalSupabaseStatus(status)) {
    throw new Error(
      `Local Supabase is not running. Start it with \`npm run db:start\` before running \`npm run ${commandName}\`.`,
    );
  }

  await writeLocalSupportFiles();
  return status;
}

async function ensureLocalDemoUser(status) {
  await runPostSeed(status);
}

async function runPostSeed(status) {
  await runCommand(process.execPath, [postSeedScriptPath], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: status.apiUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.publishableKey,
      SUPABASE_SERVICE_ROLE_KEY: status.serviceRoleKey,
    },
  });
}

async function runSqlSeedFiles() {
  for (const seedFile of seedFiles) {
    await runCommand(supabaseBin, [
      "db",
      "query",
      "--local",
      "--file",
      path.relative(repoRoot, seedFile),
    ]);
  }
}

async function runNextDev(options) {
  const { useLocalSupabase, status } = options;
  const env = useLocalSupabase
    ? {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: status.apiUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.publishableKey,
      }
    : process.env;

  await new Promise((resolve, reject) => {
    const child = spawn(nextBin, ["dev"], {
      cwd: repoRoot,
      env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`next dev exited with code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  const command = process.argv[2];
  const flags = new Set(process.argv.slice(3));
  const useRemoteSupabase = flags.has("--remote");

  switch (command) {
    case "start": {
      const status = await ensureSupabaseStarted();
      await ensureLocalDemoUser(status);
      printLocalAccessSummary(status);
      return;
    }
    case "reset": {
      await runCommand(supabaseBin, ["db", "reset", "--local", "--yes"]);
      const status = await requireRunningSupabase("db:reset");
      await runPostSeed(status);
      return;
    }
    case "seed": {
      const status = await requireRunningSupabase("db:seed");
      await runSqlSeedFiles();
      await runPostSeed(status);
      return;
    }
    case "dev": {
      if (useRemoteSupabase) {
        printRemoteAccessSummary();
        await runNextDev({
          useLocalSupabase: false,
          status: null,
        });
        return;
      }

      const status = await ensureSupabaseStarted();
      await ensureLocalDemoUser(status);
      printLocalAccessSummary(status);
      await runNextDev({
        useLocalSupabase: true,
        status,
      });
      return;
    }
    default:
      throw new Error(
        "Unknown command. Use one of: start, reset, seed, dev. Add --remote to `dev` when you want to use remote Supabase credentials.",
      );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
