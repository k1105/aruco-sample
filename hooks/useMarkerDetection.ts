"use client";

import { useCallback, useRef } from "react";
import { useOpenCV } from "@/app/components/OpenCVLoader";
import { usePose } from "@/app/components/PoseContext";
import { isArucoAvailable, detectMarkers, estimateSingleMarkerPose, fusePoses } from "@/lib/aruco";
import type { MarkerDetection } from "@/lib/types";

interface MarkerDetectionState {
  detectedMarkers: MarkerDetection[];
  fps: number;
}

interface UseMarkerDetectionReturn {
  handleFrame: (imageData: ImageData, ctx: CanvasRenderingContext2D) => void;
  stateRef: React.RefObject<MarkerDetectionState>;
}

/**
 * Hook that wires up frame processing -> marker detection -> pose estimation -> context update.
 *
 * Uses refs to hold the latest cv/updatePose so the handleFrame callback identity
 * stays stable and CameraView doesn't re-mount on every cv state change.
 */
export function useMarkerDetection(
  onStateChange: (markers: MarkerDetection[], fps: number) => void,
): UseMarkerDetectionReturn {
  const { cv } = useOpenCV();
  const { updatePose } = usePose();

  // Keep latest values in refs so handleFrame never goes stale
  const cvRef = useRef<OpenCV | null>(null);
  cvRef.current = cv;
  const updatePoseRef = useRef(updatePose);
  updatePoseRef.current = updatePose;
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const stateRef = useRef<MarkerDetectionState>({
    detectedMarkers: [],
    fps: 0,
  });

  const frameTimesRef = useRef<number[]>([]);
  const warnedRef = useRef(false);

  const handleFrame = useCallback(
    (imageData: ImageData, _ctx: CanvasRenderingContext2D) => {
      const currentCv = cvRef.current;
      if (!currentCv) return;

      if (!isArucoAvailable(currentCv)) {
        if (!warnedRef.current) {
          console.warn(
            "[useMarkerDetection] ArUco not available. Keys containing aruco:",
            Object.keys(currentCv).filter((k) => /aruco/i.test(k)),
          );
          warnedRef.current = true;
        }
        return;
      }

      // FPS measurement
      const now = performance.now();
      const frameTimes = frameTimesRef.current;
      frameTimes.push(now);
      while (frameTimes.length > 0 && frameTimes[0] < now - 1000) {
        frameTimes.shift();
      }
      const fps = frameTimes.length;

      // Detect markers
      let markers: MarkerDetection[];
      try {
        markers = detectMarkers(currentCv, imageData);
      } catch (e) {
        console.error("[useMarkerDetection] detectMarkers error:", e);
        markers = [];
      }

      // Estimate pose for each detected marker
      const poses = markers
        .map((m) => {
          try {
            return estimateSingleMarkerPose(currentCv, m);
          } catch (e) {
            console.error("[useMarkerDetection] estimateSingleMarkerPose error:", e);
            return null;
          }
        })
        .filter((p) => p !== null);

      // Fuse and update context
      if (poses.length > 0) {
        const result = fusePoses(poses);
        updatePoseRef.current(result);
      }

      // Update state
      stateRef.current = { detectedMarkers: markers, fps };
      onStateChangeRef.current(markers, fps);
    },
    [], // stable — all mutable state accessed via refs
  );

  return { handleFrame, stateRef };
}
