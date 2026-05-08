import { createClient } from "@supabase/supabase-js";

const DESIGNERS = [
  {
    email: "olena.kovalenko@threedly.local",
    username: "olena_kovalenko",
    bio: "Interior designer specializing in Scandinavian and minimalist spaces. Based in Kyiv.",
    plan_key: "pro",
    can_upload: true,

    specializations: ["furniture", "decor"],
  },
  {
    email: "dmytro.lysenko@threedly.local",
    username: "dmytro_lysenko",
    bio: "Archviz artist and 3D generalist. Focused on photorealistic residential renders.",
    plan_key: "pro",
    can_upload: true,

    specializations: ["lighting", "exterior"],
  },
  {
    email: "sofia.marchenko@threedly.local",
    username: "sofia_marchenko",
    bio: "Product designer and 3D modeler. Creates detailed kitchen and bathroom fixtures.",
    plan_key: "max",
    can_upload: true,

    specializations: ["kitchen", "bathroom", "furniture"],
  },
  {
    email: "ivan.petrenko@threedly.local",
    username: "ivan_petrenko",
    bio: "Freelance 3D artist. Specializes in decorative objects and scene props.",
    plan_key: "pro",
    can_upload: true,

    specializations: ["decor", "plants"],
  },
  {
    email: "natalia.bondarenko@threedly.local",
    username: "natalia_bondarenko",
    bio: "Studio designer at Arkhitect UA. Focuses on commercial and hospitality spaces.",
    plan_key: "max",
    can_upload: true,

    specializations: ["furniture", "exterior"],
  },
  {
    email: "oleksiy.shevchenko@threedly.local",
    username: "oleksiy_shevchenko",
    bio: "Materials and textures specialist. Builds PBR-ready surface libraries.",
    plan_key: "pro",
    can_upload: true,

    specializations: ["materials"],
  },
  {
    email: "iryna.savchenko@threedly.local",
    username: "iryna_savchenko",
    bio: "Lighting designer turned 3D artist. Expert in realistic indoor lighting setups.",
    plan_key: "free",
    can_upload: false,

    specializations: ["lighting", "technology"],
  },
  {
    email: "andrii.kravchenko@threedly.local",
    username: "andrii_kravchenko",
    bio: "Archviz generalist working with residential and landscape projects.",
    plan_key: "pro",
    can_upload: true,

    specializations: ["exterior", "plants"],
  },
  {
    email: "tetiana.karpenko@threedly.local",
    username: "tetiana_karpenko",
    bio: "3D artist focused on plants and organic decor. Creates botanical collections for interior scenes.",
    plan_key: "free",
    can_upload: false,

    specializations: ["plants", "decor"],
  },
  {
    email: "mykhailo.rudenko@threedly.local",
    username: "mykhailo_rudenko",
    bio: "Industrial designer and 3D modeler. Specializes in smart home technology and electronics.",
    plan_key: "pro",
    can_upload: true,

    specializations: ["technology", "furniture"],
  },
  {
    email: "daryna.tkachenko@threedly.local",
    username: "daryna_tkachenko",
    bio: "Interior architect with focus on luxury bathroom and spa design.",
    plan_key: "max",
    can_upload: true,

    specializations: ["bathroom", "materials", "decor"],
  },
  {
    email: "pavlo.melnyk@threedly.local",
    username: "pavlo_melnyk",
    bio: "Exterior visualization specialist. Works on residential facades and urban landscape projects.",
    plan_key: "pro",
    can_upload: true,

    specializations: ["exterior", "lighting"],
  },
  {
    email: "oksana.kovalchuk@threedly.local",
    username: "oksana_kovalchuk",
    bio: "Kitchen and dining space designer. Creates detailed cabinetry and appliance models.",
    plan_key: "pro",
    can_upload: true,

    specializations: ["kitchen", "furniture"],
  },
  {
    email: "volodymyr.hrytsenko@threedly.local",
    username: "volodymyr_hrytsenko",
    bio: "Generalist 3D artist. Builds complete room sets with curated material libraries.",
    plan_key: "max",
    can_upload: true,

    specializations: ["materials", "lighting", "furniture"],
  },
  {
    email: "yulia.moroz@threedly.local",
    username: "yulia_moroz",
    bio: "Freelance visualizer specializing in Nordic and wabi-sabi interior styles.",
    plan_key: "free",
    can_upload: false,

    specializations: ["decor", "plants"],
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

async function seedDesigner(admin, designer) {
  const { data, error } = await admin.auth.admin.createUser({
    email: designer.email,
    password: "ThreedlyDesigner123!",
    email_confirm: true,
    user_metadata: { username: designer.username },
  });

  if (error || !data.user) {
    throw error ?? new Error(`Failed to create user ${designer.email}`);
  }

  const userId = data.user.id;

  const { error: upsertError } = await admin.from("profiles").upsert(
    {
      id: userId,
      username: designer.username,
      bio: designer.bio,
      plan_key: designer.plan_key,
      can_upload: designer.can_upload,
      specializations: designer.specializations,
      downloads_used_this_month: 0,
      downloads_limit_monthly:
        designer.plan_key === "max"
          ? 100
          : designer.plan_key === "pro"
            ? 25
            : 5,
    },
    { onConflict: "id" },
  );

  if (upsertError) throw upsertError;

  return userId;
}

async function main() {
  const { url, serviceRoleKey } = await loadSupabaseEnv();
  const admin = createAdminClient(url, serviceRoleKey);

  for (const designer of DESIGNERS) {
    await seedDesigner(admin, designer);
    console.log(`Seeded designer @${designer.username}`);
  }

  console.log(`Done — seeded ${DESIGNERS.length} designers.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
