"use client";

import Header from "@/app/components/Header";
import CubeRenderer from "@/app/components/CubeRenderer";
import { usePose } from "@/app/components/PoseContext";
import type { PoseResult } from "@/lib/types";
import styles from "./page.module.css";

const MOCK_POSE: PoseResult = {
  poses: [],
  cameraPosition: { x: 0.15, y: 0.20, z: 0.50 },
  cameraRotation: { x: 10, y: 25, z: 5 },
  detectedMarkerIds: [0, 2],
  timestamp: Date.now(),
};

export default function PerformancePage() {
  const { poseResult } = usePose();
  const pose = poseResult ?? MOCK_POSE;

  return (
    <div className={styles.page}>
      <Header title="Performance" backHref="/" />
      <CubeRenderer pose={pose} />
      <div className={styles.bar}>
        pos:({pose.cameraPosition.x.toFixed(2)},{pose.cameraPosition.y.toFixed(2)},{pose.cameraPosition.z.toFixed(2)})
        {!poseResult && <span className={styles.mock}>mock</span>}
      </div>
    </div>
  );
}
