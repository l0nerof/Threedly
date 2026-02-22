import { BookOpen, Eye, Palette, Search, Upload, Users } from "lucide-react";

export const audiences = [
  {
    id: "designers",
    icon: Eye,
    itemIcons: [Search, Palette, Eye],
  },
  {
    id: "creators",
    icon: Upload,
    itemIcons: [BookOpen, Users, Upload],
  },
] as const;
