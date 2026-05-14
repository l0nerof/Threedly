import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";

const PLAN_DOWNLOAD_LIMITS = { max: 100, pro: 25, free: 5 };

export const DESIGNER_MODEL_ASSIGNMENTS = {
  olena_kovalenko: [
    "11111111-1111-1111-1111-111111111113",
    "11111111-1111-1111-1111-111111111114",
    "11111111-1111-1111-1111-111111111115",
  ],
  dmytro_lysenko: [
    "11111111-1111-1111-1111-111111111116",
    "11111111-1111-1111-1111-111111111117",
    "11111111-1111-1111-1111-111111111118",
  ],
  sofia_marchenko: [
    "11111111-1111-1111-1111-111111111119",
    "11111111-1111-1111-1111-111111111120",
    "11111111-1111-1111-1111-111111111121",
  ],
  ivan_petrenko: [
    "11111111-1111-1111-1111-111111111122",
    "11111111-1111-1111-1111-111111111123",
    "11111111-1111-1111-1111-111111111124",
  ],
  natalia_bondarenko: [
    "11111111-1111-1111-1111-111111111125",
    "11111111-1111-1111-1111-111111111126",
    "11111111-1111-1111-1111-111111111127",
  ],
  oleksiy_shevchenko: [
    "11111111-1111-1111-1111-111111111128",
    "11111111-1111-1111-1111-111111111129",
    "11111111-1111-1111-1111-111111111130",
  ],
  andrii_kravchenko: [
    "11111111-1111-1111-1111-111111111131",
    "11111111-1111-1111-1111-111111111132",
    "11111111-1111-1111-1111-111111111133",
  ],
  mykhailo_rudenko: [
    "11111111-1111-1111-1111-111111111134",
    "11111111-1111-1111-1111-111111111135",
    "11111111-1111-1111-1111-111111111147",
  ],
  daryna_tkachenko: [
    "11111111-1111-1111-1111-111111111136",
    "11111111-1111-1111-1111-111111111137",
    "11111111-1111-1111-1111-111111111138",
  ],
  pavlo_melnyk: [
    "11111111-1111-1111-1111-111111111139",
    "11111111-1111-1111-1111-111111111140",
    "11111111-1111-1111-1111-111111111148",
  ],
  volodymyr_hrytsenko: [
    "11111111-1111-1111-1111-111111111141",
    "11111111-1111-1111-1111-111111111142",
    "11111111-1111-1111-1111-111111111143",
  ],
  oksana_kovalchuk: [
    "11111111-1111-1111-1111-111111111144",
    "11111111-1111-1111-1111-111111111145",
    "11111111-1111-1111-1111-111111111146",
    "11111111-1111-1111-1111-111111111149",
  ],
};

const DESIGNERS = [
  {
    email: "olena.kovalenko@threedly.local",
    username: "olena_kovalenko",
    bio: "Interior designer specializing in Scandinavian and minimalist spaces. Based in Kyiv.",
    plan_key: "pro",
    can_upload: true,
  },
  {
    email: "dmytro.lysenko@threedly.local",
    username: "dmytro_lysenko",
    bio: "Archviz artist and 3D generalist. Focused on photorealistic residential renders.",
    plan_key: "pro",
    can_upload: true,
  },
  {
    email: "sofia.marchenko@threedly.local",
    username: "sofia_marchenko",
    bio: "Product designer and 3D modeler. Creates detailed kitchen and bathroom fixtures.",
    plan_key: "max",
    can_upload: true,
  },
  {
    email: "ivan.petrenko@threedly.local",
    username: "ivan_petrenko",
    bio: "Freelance 3D artist. Specializes in decorative objects and scene props.",
    plan_key: "pro",
    can_upload: true,
  },
  {
    email: "natalia.bondarenko@threedly.local",
    username: "natalia_bondarenko",
    bio: "Studio designer at Arkhitect UA. Focuses on commercial and hospitality spaces.",
    plan_key: "max",
    can_upload: true,
  },
  {
    email: "oleksiy.shevchenko@threedly.local",
    username: "oleksiy_shevchenko",
    bio: "Materials and textures specialist. Builds PBR-ready surface libraries.",
    plan_key: "pro",
    can_upload: true,
  },
  {
    email: "iryna.savchenko@threedly.local",
    username: "iryna_savchenko",
    bio: "Lighting designer turned 3D artist. Expert in realistic indoor lighting setups.",
    plan_key: "free",
    can_upload: false,
  },
  {
    email: "andrii.kravchenko@threedly.local",
    username: "andrii_kravchenko",
    bio: "Archviz generalist working with residential and landscape projects.",
    plan_key: "pro",
    can_upload: true,
  },
  {
    email: "tetiana.karpenko@threedly.local",
    username: "tetiana_karpenko",
    bio: "3D artist focused on plants and organic decor. Creates botanical collections for interior scenes.",
    plan_key: "free",
    can_upload: false,
  },
  {
    email: "mykhailo.rudenko@threedly.local",
    username: "mykhailo_rudenko",
    bio: "Industrial designer and 3D modeler. Specializes in smart home technology and electronics.",
    plan_key: "pro",
    can_upload: true,
  },
  {
    email: "daryna.tkachenko@threedly.local",
    username: "daryna_tkachenko",
    bio: "Interior architect with focus on luxury bathroom and spa design.",
    plan_key: "max",
    can_upload: true,
  },
  {
    email: "pavlo.melnyk@threedly.local",
    username: "pavlo_melnyk",
    bio: "Exterior visualization specialist. Works on residential facades and urban landscape projects.",
    plan_key: "pro",
    can_upload: true,
  },
  {
    email: "oksana.kovalchuk@threedly.local",
    username: "oksana_kovalchuk",
    bio: "Kitchen and dining space designer. Creates detailed cabinetry and appliance models.",
    plan_key: "pro",
    can_upload: true,
  },
  {
    email: "volodymyr.hrytsenko@threedly.local",
    username: "volodymyr_hrytsenko",
    bio: "Generalist 3D artist. Builds complete room sets with curated material libraries.",
    plan_key: "max",
    can_upload: true,
  },
  {
    email: "yulia.moroz@threedly.local",
    username: "yulia_moroz",
    bio: "Freelance visualizer specializing in Nordic and wabi-sabi interior styles.",
    plan_key: "free",
    can_upload: false,
  },
];

async function loadSupabaseEnv() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (envUrl && envServiceRoleKey) {
    return { url: envUrl, serviceRoleKey: envServiceRoleKey };
  }

  throw new Error(
    "Local Supabase credentials are missing. Run the script through `npm run db:start`, `npm run db:reset`, or `npm run db:seed`.",
  );
}

function createAdminClient(url, serviceRoleKey) {
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function seedDesigner(admin, designer, existingUsers) {
  const existing = existingUsers.find((u) => u.email === designer.email);

  let userId;

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: "ThreedlyDesigner123!",
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, username: designer.username },
    });
    if (error || !data.user) {
      throw error ?? new Error(`Failed to update user ${designer.email}`);
    }
    userId = data.user.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: designer.email,
      password: "ThreedlyDesigner123!",
      email_confirm: true,
      user_metadata: { username: designer.username },
    });
    if (error || !data.user) {
      throw error ?? new Error(`Failed to create user ${designer.email}`);
    }
    userId = data.user.id;
  }

  const { error: upsertError } = await admin.from("profiles").upsert(
    {
      id: userId,
      username: designer.username,
      bio: designer.bio,
      plan_key: designer.plan_key,
      can_upload: designer.can_upload,
      downloads_used_this_month: 0,
      downloads_limit_monthly: PLAN_DOWNLOAD_LIMITS[designer.plan_key],
    },
    { onConflict: "id" },
  );

  if (upsertError) throw upsertError;

  return userId;
}

function getExistingDesignerIdsByUsername(existingUsers) {
  const designerIdsByUsername = new Map();

  for (const designer of DESIGNERS) {
    const existing = existingUsers.find((u) => u.email === designer.email);

    if (existing) {
      designerIdsByUsername.set(designer.username, existing.id);
    }
  }

  return designerIdsByUsername;
}

async function seedDesignerModelAssignments(admin, designerIdsByUsername) {
  for (const [username, modelIds] of Object.entries(
    DESIGNER_MODEL_ASSIGNMENTS,
  )) {
    const creatorId = designerIdsByUsername.get(username);

    if (!creatorId) {
      throw new Error(`Missing seeded designer @${username}.`);
    }

    const { error } = await admin
      .from("models")
      .update({ creator_id: creatorId })
      .in("id", modelIds);

    if (error) {
      throw error;
    }
  }
}

async function main() {
  const skipIfExists = process.argv.includes("--skip-if-exists");
  const { url, serviceRoleKey } = await loadSupabaseEnv();
  const admin = createAdminClient(url, serviceRoleKey);

  const { data: listData, error: listError } = await admin.auth.admin.listUsers(
    { page: 1, perPage: 1000 },
  );
  if (listError) throw listError;

  if (skipIfExists) {
    const firstEmail = DESIGNERS[0].email;
    const alreadyExists = listData.users.some((u) => u.email === firstEmail);
    if (alreadyExists) {
      await seedDesignerModelAssignments(
        admin,
        getExistingDesignerIdsByUsername(listData.users),
      );
      return;
    }
  }

  const designerIdsByUsername = new Map();

  for (const designer of DESIGNERS) {
    const userId = await seedDesigner(admin, designer, listData.users);
    designerIdsByUsername.set(designer.username, userId);
    console.log(`Seeded designer @${designer.username}`);
  }

  await seedDesignerModelAssignments(admin, designerIdsByUsername);

  console.log(`Done — seeded ${DESIGNERS.length} designers.`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
