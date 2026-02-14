"use client";

import type { MarkerDetection, PoseResult, LoadingState } from "@/lib/types";
import styles from "./StatusOverlay.module.css";

interface StatusOverlayProps {
  opencvStatus: LoadingState;
  detectedMarkers: MarkerDetection[];
  pose: PoseResult | null;
  fps: number;
}

export default function StatusOverlay({
  opencvStatus,
  detectedMarkers,
  pose,
  fps,
}: StatusOverlayProps) {
  return (
    <div className={styles.bar}>
      <span>cv:{opencvStatus === "ready" ? "ok" : opencvStatus}</span>
      <span>markers:{detectedMarkers.length}</span>
      {pose && (
        <span>
          pos:({pose.cameraPosition.x.toFixed(2)},{pose.cameraPosition.y.toFixed(2)},{pose.cameraPosition.z.toFixed(2)})
        </span>
      )}
      <span className={styles.fps}>{fps.toFixed(0)}fps</span>
    </div>
  );
}
