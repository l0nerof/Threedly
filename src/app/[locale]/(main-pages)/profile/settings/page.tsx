import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { Card } from "@/src/shared/components/Card";
import { Separator } from "@/src/shared/components/Separator";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  removeAvatarAction,
  updateProfileAction,
  uploadAvatarAction,
} from "./actions";
import ProfileSettingsForm from "./components/ProfileSettingsForm";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProfileSettingsPage({ params }: Props) {
  const { locale } = await params;

  if (!isLocaleCode(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Profile");

  const updateProfileWithLocale = updateProfileAction.bind(null, locale);
  const uploadAvatarWithLocale = uploadAvatarAction.bind(null, locale);
  const removeAvatarWithLocale = removeAvatarAction.bind(null, locale);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("settings.subtitle")}
        </p>
      </div>
      <Separator />

      <Card className="border-border/60 gap-4 rounded-2xl p-6 shadow-none">
        <ProfileSettingsForm
          onSubmitAction={updateProfileWithLocale}
          onUploadAvatarAction={uploadAvatarWithLocale}
          onRemoveAvatarAction={removeAvatarWithLocale}
        />
      </Card>
    </section>
  );
}
