"use client";

import Ballpit from "@/src/shared/components/Ballpit";
import DotGrid from "@/src/shared/components/DotGrid";
import Galaxy from "@/src/shared/components/Galaxy";
import Iridescence from "@/src/shared/components/Iridescence";
import Waves from "@/src/shared/components/Waves";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type VisualItem = {
  key: string;
  node: ReactNode;
};

function AuthVisual() {
  const visuals = useMemo<VisualItem[]>(
    () => [
      {
        key: "iridescence",
        node: <Iridescence />,
      },
      {
        key: "dotgrid",
        node: <DotGrid className="h-full w-full" />,
      },
      {
        key: "galaxy",
        node: <Galaxy />,
      },
      {
        key: "waves",
        node: <Waves className="h-full w-full" />,
      },
      {
        key: "ballpit",
        node: <Ballpit className="h-full w-full" />,
      },
    ],
    [],
  );

  const [index] = useState(() => Math.floor(Math.random() * visuals.length));

  const current = visuals[index] ?? visuals[0];

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0">{current.node}</div>
      <div className="absolute inset-0 bg-linear-to-br from-black/25 via-transparent to-black/40" />
    </div>
  );
}

export default AuthVisual;
