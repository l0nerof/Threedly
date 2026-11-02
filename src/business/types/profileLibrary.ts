import type { z } from "zod";
import type {
  profileLibraryPageSchema,
  profileLibraryTabSchema,
} from "../schemas/profileLibrary";

export type ProfileLibraryTab = z.infer<typeof profileLibraryTabSchema>;
export type ProfileLibraryPage = z.infer<typeof profileLibraryPageSchema>;
export type ProfileLibraryResult =
  | { ok: true; library: ProfileLibraryPage }
  | { ok: false; error: "unauthorized" | "generic" | "timeout" };
