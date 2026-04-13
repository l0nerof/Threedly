import {
  Download,
  FolderHeart,
  LucideIcon,
  MailCheck,
  Search,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";

export type AuthValueBulletConfig = {
  icon: LucideIcon;
  key: "catalog" | "formats" | "publish";
  isBeta?: boolean;
  betaKey?: "beta";
};

export const sharedAuthValueBullets: AuthValueBulletConfig[] = [
  { icon: Search, key: "catalog" },
  { icon: Download, key: "formats" },
  { icon: Upload, key: "publish", isBeta: true, betaKey: "beta" },
];

export const authSupportCardKeys = ["one", "two"] as const;

export const authVisualCards = [
  { icon: Search, key: "one" },
  { icon: FolderHeart, key: "two" },
  { icon: UserRound, key: "three" },
] as const;

export const verifyEmailSupportCards = [
  { icon: MailCheck, key: "one" },
  { icon: ShieldCheck, key: "two" },
] as const;
