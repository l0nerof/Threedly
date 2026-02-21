import { LibraryIcon, SettingsIcon, UploadIcon, UserIcon } from "lucide-react";

export const sidebarItems = [
  { icon: UserIcon, href: "/profile", key: "overview" },
  { icon: LibraryIcon, href: "/profile/library", key: "library" },
  { icon: UploadIcon, href: "/profile/uploads", key: "uploads" },
  { icon: SettingsIcon, href: "/profile/settings", key: "settings" },
] as const;
