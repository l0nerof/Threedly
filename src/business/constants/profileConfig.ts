import { Download, Heart, UserRoundPlus } from "lucide-react";

export const UPLOADS_PAGE_SIZE = 5;

export const PROFILE_LIBRARY_PAGE_SIZE = 24;
export const profileLibraryTabValues = [
  "downloaded",
  "favoriteModels",
  "subscriptions",
] as const;
export const profileLibraryTabs = [
  { value: "downloaded", icon: Download },
  { value: "favoriteModels", icon: Heart },
  { value: "subscriptions", icon: UserRoundPlus },
] as const;
