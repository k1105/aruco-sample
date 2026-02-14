import type { MarkerDefinition, CameraConfig } from "./types";

// ============================================================
// Marker & Cube Constants
// ============================================================

/** ArUco dictionary type */
export const ARUCO_DICT = "DICT_4X4_50";

/** Cube edge length in meters */
export const CUBE_SIZE = 0.12;

/** Marker edge length in meters */
export const MARKER_SIZE = 0.09;

/** Half of cube edge length (used for coordinate calculations) */
const HALF_CUBE = CUBE_SIZE / 2; // 0.06

/**
 * Marker definitions for each face of the cube.
 * Origin is at the cube center. Coordinate system:
 *   X: right, Y: up, Z: toward viewer (front)
 */
export const MARKER_DEFINITIONS: MarkerDefinition[] = [
  {
    id: 0,
    face: "front",
    normal: { x: 0, y: 0, z: 1 },
    center: { x: 0, y: 0, z: HALF_CUBE },
    rotationToWorld: { x: 0, y: 0, z: 0 },
  },
  {
    id: 1,
    face: "top",
    normal: { x: 0, y: 1, z: 0 },
    center: { x: 0, y: HALF_CUBE, z: 0 },
    rotationToWorld: { x: -Math.PI / 2, y: 0, z: 0 },
  },
  {
    id: 2,
    face: "right",
    normal: { x: 1, y: 0, z: 0 },
    center: { x: HALF_CUBE, y: 0, z: 0 },
    rotationToWorld: { x: 0, y: -Math.PI / 2, z: 0 },
  },
  {
    id: 3,
    face: "back",
    normal: { x: 0, y: 0, z: -1 },
    center: { x: 0, y: 0, z: -HALF_CUBE },
    rotationToWorld: { x: 0, y: Math.PI, z: 0 },
  },
  {
    id: 4,
    face: "left",
    normal: { x: -1, y: 0, z: 0 },
    center: { x: -HALF_CUBE, y: 0, z: 0 },
    rotationToWorld: { x: 0, y: Math.PI / 2, z: 0 },
  },
];

// ============================================================
// Camera Defaults
// ============================================================

/** Default camera configuration */
export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  width: 640,
  height: 480,
  facingMode: "environment",
};

/**
 * Default camera intrinsic matrix values (for 640x480 resolution).
 * These are approximate values for iPad cameras.
 */
export const DEFAULT_CAMERA_INTRINSICS = {
  fx: 600,
  fy: 600,
  cx: 320,
  cy: 240,
} as const;

/** Default distortion coefficients (no distortion) */
export const DEFAULT_DIST_COEFFS = [0, 0, 0, 0, 0] as const;

// ============================================================
// Processing
// ============================================================

/** Target FPS for marker detection processing */
export const TARGET_DETECTION_FPS = 30;

/** Virtual cube color for Three.js rendering */
export const VIRTUAL_CUBE_COLOR = 0x4488ff;

/** Virtual cube opacity */
export const VIRTUAL_CUBE_OPACITY = 0.8;
