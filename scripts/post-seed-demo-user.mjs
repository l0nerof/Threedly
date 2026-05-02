import { createClient } from "@supabase/supabase-js";
import {
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  DEMO_USER_USERNAME,
} from "./demo-user-credentials.mjs";

const DEMO_USER_BIO =
  "Demo creator account for local frontend development and seeded profile states.";

const FAVORITE_MODEL_IDS = [
  "11111111-1111-1111-1111-111111111101",
  "11111111-1111-1111-1111-111111111103",
];
const DOWNLOADED_MODEL_IDS = [
  "11111111-1111-1111-1111-111111111101",
  "11111111-1111-1111-1111-111111111102",
  "11111111-1111-1111-1111-111111111105",
];
const UPLOADED_MODEL_IDS = [
  "11111111-1111-1111-1111-111111111104",
  "11111111-1111-1111-1111-111111111106",
  "11111111-1111-1111-1111-111111111107",
  "11111111-1111-1111-1111-111111111108",
  "11111111-1111-1111-1111-111111111109",
  "11111111-1111-1111-1111-111111111110",
  "11111111-1111-1111-1111-111111111111",
  "11111111-1111-1111-1111-111111111112",
];

async function loadSupabaseEnv() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (envUrl && envServiceRoleKey) {
    return {
      url: envUrl,
      serviceRoleKey: envServiceRoleKey,
    };
  }

  throw new Error(
    "Local Supabase credentials are missing. Run the script through `npm run db:start`, `npm run db:reset`, or `npm run db:seed`.",
  );
}

function createAdminClient(url, serviceRoleKey) {
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function ensureDemoUser(admin) {
  const {
    data: { users },
    error: listUsersError,
  } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (listUsersError) {
    throw listUsersError;
  }

  const existingUser = users.find((user) => user.email === DEMO_USER_EMAIL);

  if (!existingUser) {
    const { data, error } = await admin.auth.admin.createUser({
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        username: DEMO_USER_USERNAME,
      },
    });

    if (error || !data.user) {
      throw error ?? new Error("Failed to create the demo user.");
    }

    return data.user;
  }

  const { data, error } = await admin.auth.admin.updateUserById(
    existingUser.id,
    {
      password: DEMO_USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        username: DEMO_USER_USERNAME,
      },
    },
  );

  if (error || !data.user) {
    throw error ?? new Error("Failed to update the demo user.");
  }

  return data.user;
}

async function ensureDemoProfile(admin, userId) {
  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      username: DEMO_USER_USERNAME,
      avatar_path: null,
      bio: DEMO_USER_BIO,
      plan_key: "pro",
      downloads_used_this_month: 3,
      downloads_limit_monthly: 25,
      can_upload: true,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw error;
  }
}

async function seedFavorites(admin, userId) {
  const { error: deleteError } = await admin
    .from("favorites")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  const { error: insertError } = await admin.from("favorites").insert(
    FAVORITE_MODEL_IDS.map((modelId) => ({
      user_id: userId,
      model_id: modelId,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

async function seedDownloads(admin, userId) {
  const { error: deleteError } = await admin
    .from("downloads")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  const createdAt = [
    "2026-04-01T10:00:00Z",
    "2026-04-05T12:30:00Z",
    "2026-04-09T16:45:00Z",
  ];

  const { error: insertError } = await admin.from("downloads").insert(
    DOWNLOADED_MODEL_IDS.map((modelId, index) => ({
      user_id: userId,
      model_id: modelId,
      created_at: createdAt[index],
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

async function seedUploadedModels(admin, userId) {
  const { error } = await admin
    .from("models")
    .update({
      creator_id: userId,
    })
    .in("id", UPLOADED_MODEL_IDS);

  if (error) {
    throw error;
  }
}

async function main() {
  const { url, serviceRoleKey } = await loadSupabaseEnv();
  const admin = createAdminClient(url, serviceRoleKey);
  const user = await ensureDemoUser(admin);

  await ensureDemoProfile(admin, user.id);
  await seedFavorites(admin, user.id);
  await seedDownloads(admin, user.id);
  await seedUploadedModels(admin, user.id);

  console.log(`Seeded demo user ${DEMO_USER_EMAIL}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
