"use client";

import { useState, useCallback } from "react";
import Header from "@/app/components/Header";
import CameraView from "@/app/components/CameraView";
import StatusOverlay from "@/app/components/StatusOverlay";
import { useOpenCV } from "@/app/components/OpenCVLoader";
import { usePose } from "@/app/components/PoseContext";
import { useMarkerDetection } from "@/hooks/useMarkerDetection";
import type { MarkerDetection } from "@/lib/types";
import styles from "./page.module.css";

export default function CalibrationPage() {
  const { status: opencvStatus } = useOpenCV();
  const { poseResult } = usePose();
  const [detectedMarkers, setDetectedMarkers] = useState<MarkerDetection[]>([]);
  const [fps, setFps] = useState(0);

  const onStateChange = useCallback(
    (markers: MarkerDetection[], newFps: number) => {
      setDetectedMarkers(markers);
      setFps(newFps);
    },
    [],
  );

  const { handleFrame } = useMarkerDetection(onStateChange);

  return (
    <div className={styles.page}>
      <Header title="Calibration" backHref="/" />
      <CameraView onFrame={handleFrame} markers={detectedMarkers} />
      <StatusOverlay
        opencvStatus={opencvStatus}
        detectedMarkers={detectedMarkers}
        pose={poseResult}
        fps={fps}
      />
    </div>
  );
}
