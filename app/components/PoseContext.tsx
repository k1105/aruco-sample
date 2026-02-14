"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { PoseResult } from "@/lib/types";

interface PoseContextValue {
  /** Latest pose estimation result */
  poseResult: PoseResult | null;
  /** Update the pose result */
  updatePose: (pose: PoseResult) => void;
  /** Clear the pose result */
  clearPose: () => void;
}

const PoseContext = createContext<PoseContextValue>({
  poseResult: null,
  updatePose: () => {},
  clearPose: () => {},
});

/** Access the shared pose context */
export function usePose() {
  return useContext(PoseContext);
}

interface PoseProviderProps {
  children: ReactNode;
}

/**
 * Provides shared pose state across pages.
 *
 * The calibration page updates the pose via updatePose(),
 * and the performance page reads it to position the Three.js camera.
 */
export function PoseProvider({ children }: PoseProviderProps) {
  const [poseResult, setPoseResult] = useState<PoseResult | null>(null);

  const updatePose = useCallback((pose: PoseResult) => {
    setPoseResult(pose);
  }, []);

  const clearPose = useCallback(() => {
    setPoseResult(null);
  }, []);

  return (
    <PoseContext.Provider value={{ poseResult, updatePose, clearPose }}>
      {children}
    </PoseContext.Provider>
  );
}
