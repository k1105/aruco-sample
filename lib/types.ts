// ============================================================
// Shared Type Definitions
// ============================================================

/** 2D point in image coordinates (pixels) */
export interface Point2D {
  x: number;
  y: number;
}

/** 3D point in world coordinates (meters) */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/** Euler angles in degrees */
export interface EulerAngles {
  x: number;
  y: number;
  z: number;
}

/** Single detected ArUco marker */
export interface MarkerDetection {
  id: number;
  corners: [Point2D, Point2D, Point2D, Point2D];
}

/** Estimated camera pose from marker detection */
export interface PoseEstimation {
  position: Point3D;
  rotation: EulerAngles;
  rvec: [number, number, number];
  tvec: [number, number, number];
  markerId: number;
}

/** Aggregated pose result from one or more markers */
export interface PoseResult {
  poses: PoseEstimation[];
  /** Fused camera position (average when multiple markers detected) */
  cameraPosition: Point3D;
  /** Fused camera rotation */
  cameraRotation: EulerAngles;
  /** IDs of all detected markers */
  detectedMarkerIds: number[];
  timestamp: number;
}

/** Camera stream configuration */
export interface CameraConfig {
  width: number;
  height: number;
  facingMode: "user" | "environment";
}

/** Application mode */
export type AppMode = "calibration" | "performance";

/** Async loading state */
export type LoadingState = "loading" | "ready" | "error";

/** Marker face on the cube */
export type MarkerFace = "front" | "top" | "right" | "back" | "left";

/** Definition for a marker placed on the cube */
export interface MarkerDefinition {
  id: number;
  face: MarkerFace;
  /** Normal direction of the face */
  normal: Point3D;
  /** Center position of the marker in world coordinates (meters) */
  center: Point3D;
  /** Rotation from marker-local coordinates to world coordinates (Euler angles in radians) */
  rotationToWorld: EulerAngles;
}
