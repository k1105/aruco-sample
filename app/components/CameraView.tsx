"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { CameraConfig, MarkerDetection } from "@/lib/types";
import { DEFAULT_CAMERA_CONFIG } from "@/lib/constants";
import styles from "./CameraView.module.css";

interface CameraViewProps {
  config?: CameraConfig;
  onFrame?: (imageData: ImageData, ctx: CanvasRenderingContext2D) => void;
  markers?: MarkerDetection[];
  active?: boolean;
}

export default function CameraView({
  config = DEFAULT_CAMERA_CONFIG,
  onFrame,
  markers = [],
  active = true,
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: config.width },
          height: { ideal: config.height },
          facingMode: config.facingMode,
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(video.error);
      });
      await video.play();
      setIsStreaming(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setCameraError(err instanceof Error ? err.message : "Camera access failed");
    }
  }, [config.width, config.height, config.facingMode]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreaming(false);
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  useEffect(() => {
    if (!isStreaming || !active) return;
    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      if (onFrame) {
        onFrame(ctx.getImageData(0, 0, canvas.width, canvas.height), ctx);
      }
      drawMarkerOverlays(ctx, markers);
      animFrameRef.current = requestAnimationFrame(processFrame);
    };
    animFrameRef.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isStreaming, active, onFrame, markers]);

  useEffect(() => {
    if (active) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [active, startCamera, stopCamera]);

  return (
    <div className={styles.container}>
      <video ref={videoRef} className={styles.video} playsInline muted />
      <canvas ref={canvasRef} className={styles.canvas} />
      {!isStreaming && !cameraError && (
        <p className={styles.msg}>Starting camera...</p>
      )}
      {cameraError && (
        <div className={styles.msg}>
          <p>{cameraError}</p>
          <button onClick={startCamera}>Retry</button>
        </div>
      )}
    </div>
  );
}

function drawMarkerOverlays(ctx: CanvasRenderingContext2D, markers: MarkerDetection[]) {
  for (const marker of markers) {
    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(marker.corners[0].x, marker.corners[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(marker.corners[i].x, marker.corners[i].y);
    ctx.closePath();
    ctx.stroke();

    const cx = marker.corners.reduce((s, c) => s + c.x, 0) / 4;
    const cy = marker.corners.reduce((s, c) => s + c.y, 0) / 4;
    ctx.font = "bold 14px monospace";
    ctx.fillStyle = "#0f0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${marker.id}`, cx, cy);
  }
}
