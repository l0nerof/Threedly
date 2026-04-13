"use client";

import Ballpit from "@/src/shared/components/Ballpit";
import DotGrid from "@/src/shared/components/DotGrid";
import Galaxy from "@/src/shared/components/Galaxy";
import Iridescence from "@/src/shared/components/Iridescence";
import Waves from "@/src/shared/components/Waves";

const AUTH_VISUAL_KEYS = [
  "iridescence",
  "dotgrid",
  "galaxy",
  "waves",
  "ballpit",
] as const;

const authVisualKey =
  AUTH_VISUAL_KEYS[Math.floor(Math.random() * AUTH_VISUAL_KEYS.length)] ??
  "iridescence";

function AuthVisualBackground() {
  switch (authVisualKey) {
    case "dotgrid":
      return <DotGrid className="h-full w-full" />;
    case "galaxy":
      return <Galaxy />;
    case "waves":
      return <Waves className="h-full w-full" />;
    case "ballpit":
      return <Ballpit className="h-full w-full" />;
    case "iridescence":
    default:
      return <Iridescence />;
  }
}

export default AuthVisualBackground;
