"use client";

import { ProfileAvatar } from "@/src/business/components/ProfileAvatar";
import { createClient } from "@/src/business/utils/supabase/client";
import { Button } from "@/src/shared/components/Button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/components/DropdownMenu";
import { Input } from "@/src/shared/components/Input";
import { Label } from "@/src/shared/components/Label";
import { Textarea } from "@/src/shared/components/Textarea";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { UpdateProfileActionResult } from "../../actions";

type ProfileSettingsFormProps = {
  onSubmitAction: (formData: FormData) => Promise<UpdateProfileActionResult>;
};

function ProfileSettingsForm({ onSubmitAction }: ProfileSettingsFormProps) {
  const t = useTranslations("Profile");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [savedUsername, setSavedUsername] = useState("");
  const [savedBio, setSavedBio] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!isCancelled) {
          setIsLoadingProfile(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, bio, avatar_path")
        .eq("id", user.id)
        .maybeSingle();

      if (isCancelled) {
        return;
      }

      setEmail(user.email ?? "");
      setAvatarPath(profile?.avatar_path ?? null);
      setUsername(profile?.username ?? "");
      setBio(profile?.bio ?? "");
      setSavedUsername(profile?.username ?? "");
      setSavedBio(profile?.bio ?? "");
      setIsLoadingProfile(false);
    };

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, []);

  const hasChanges = useMemo(() => {
    const normalizedInitialUsername = savedUsername.trim().toLowerCase();
    const normalizedCurrentUsername = username.trim().toLowerCase();
    const normalizedInitialBio = savedBio.trim();
    const normalizedCurrentBio = bio.trim();

    return (
      normalizedCurrentUsername !== normalizedInitialUsername ||
      normalizedCurrentBio !== normalizedInitialBio
    );
  }, [bio, savedBio, savedUsername, username]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasChanges || isSubmitting || isLoadingProfile) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await onSubmitAction(formData);

      if (!result.ok) {
        toast.error(t("settings.profile.saveError"));
        return;
      }

      setSavedUsername(username);
      setSavedBio(bio);
      toast.success(t("settings.profile.saveSuccess"));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contents">
      <CardHeader className="flex flex-row items-center justify-between gap-4 p-0">
        <div className="flex flex-col gap-2">
          <CardTitle>{t("settings.profile.title")}</CardTitle>
          <CardDescription>{t("settings.profile.description")}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group relative cursor-pointer rounded-full"
              aria-label={t("settings.profile.avatarMenuAriaLabel")}
            >
              <ProfileAvatar avatarPath={avatarPath} />
              <span className="absolute inset-0 rounded-full bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                <PencilIcon className="size-4 text-white" />
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                avatarInputRef.current?.click();
              }}
            >
              {t("settings.profile.avatarMenu.upload")}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {t("settings.profile.avatarMenu.remove")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Input
          ref={avatarInputRef}
          id="avatar"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={() => {
            // Upload and remove actions are intentionally UI-only for now.
          }}
        />
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">{t("settings.profile.username")}</Label>
          <Input
            id="username"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={t("settings.profile.username")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="bio">{t("settings.profile.bio")}</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={4}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder={t("settings.profile.bioPlaceholder")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t("settings.profile.email")}</Label>
          <Input id="email" value={email} readOnly />
        </div>
      </CardContent>
      <CardFooter className="p-0">
        <Button
          type="submit"
          variant="outline"
          disabled={!hasChanges || isSubmitting || isLoadingProfile}
        >
          {t("settings.profile.save")}
        </Button>
      </CardFooter>
    </form>
  );
}

export default ProfileSettingsForm;
