"use client";

import type { ReactNode } from "react";
import { OpenCVProvider } from "./components/OpenCVLoader";
import { PoseProvider } from "./components/PoseContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <OpenCVProvider>
      <PoseProvider>{children}</PoseProvider>
    </OpenCVProvider>
  );
}
