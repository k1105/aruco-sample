/**
 * ArUco marker detection and camera pose estimation.
 *
 * All functions are pure — they accept an OpenCV `cv` object and plain JS inputs,
 * return plain JS objects, and delete all intermediate Mats before returning.
 */

import type { MarkerDetection, PoseEstimation, PoseResult, Point3D, EulerAngles } from "./types";
import {
  MARKER_SIZE,
  MARKER_DEFINITIONS,
  DEFAULT_CAMERA_INTRINSICS,
  DEFAULT_DIST_COEFFS,
} from "./constants";

// ============================================================
// Runtime availability check
// ============================================================

/** Returns true if the ArUco detector API (objdetect, OpenCV 4.7+) is available. */
export function isArucoAvailable(cv: OpenCV): boolean {
  return (
    typeof cv.aruco_ArucoDetector === "function" &&
    typeof cv.aruco_Dictionary === "function" &&
    typeof cv.aruco_DetectorParameters === "function"
  );
}

// ============================================================
// Marker detection
// ============================================================

/**
 * Detect ArUco markers in an RGBA ImageData frame.
 *
 * Returns an array of MarkerDetection (id + 4 corners in pixel coords).
 * All OpenCV Mats are created and deleted within this function.
 */
export function detectMarkers(cv: OpenCV, imageData: ImageData): MarkerDetection[] {
  const src = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  const corners = new cv.MatVector();
  const ids = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    const dictionary = cv.getPredefinedDictionary(cv.DICT_4X4_50);
    const parameters = new cv.aruco_DetectorParameters();
    const refineParams = new cv.aruco_RefineParameters(10, 3, true);
    const detector = new cv.aruco_ArucoDetector(dictionary, parameters, refineParams);

    try {
      detector.detectMarkers(gray, corners, ids);
    } finally {
      detector.delete();
      refineParams.delete();
      parameters.delete();
      dictionary.delete();
    }

    const count = ids.rows;
    const detections: MarkerDetection[] = [];

    for (let i = 0; i < count; i++) {
      const id = ids.data32S ? ids.data32S[i] : ids.intAt(i, 0);
      const cornerMat = corners.get(i);
      const markerCorners: [
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
      ] = [
        { x: cornerMat.data32F[0], y: cornerMat.data32F[1] },
        { x: cornerMat.data32F[2], y: cornerMat.data32F[3] },
        { x: cornerMat.data32F[4], y: cornerMat.data32F[5] },
        { x: cornerMat.data32F[6], y: cornerMat.data32F[7] },
      ];
      cornerMat.delete();
      detections.push({ id, corners: markerCorners });
    }

    return detections;
  } finally {
    src.delete();
    gray.delete();
    corners.delete();
    ids.delete();
  }
}

// ============================================================
// Single-marker pose estimation
// ============================================================

/** Half marker size for 3D object point definitions */
const HALF = MARKER_SIZE / 2;

/**
 * Estimate camera pose from a single detected marker using solvePnP.
 *
 * The 3D object points are the marker corners in marker-local coordinates
 * (centered at marker origin, Z=0 plane).
 *
 * Returns null if the marker ID is not in MARKER_DEFINITIONS or solvePnP fails.
 */
export function estimateSingleMarkerPose(
  cv: OpenCV,
  marker: MarkerDetection,
): PoseEstimation | null {
  const def = MARKER_DEFINITIONS.find((m) => m.id === marker.id);
  if (!def) return null;

  // 3D object points: marker corners in marker-local frame (counter-clockwise from top-left)
  // OpenCV ArUco convention: TL, TR, BR, BL
  const objectPoints = cv.matFromArray(4, 1, cv.CV_32FC3, [
    -HALF,  HALF, 0,  // top-left
     HALF,  HALF, 0,  // top-right
     HALF, -HALF, 0,  // bottom-right
    -HALF, -HALF, 0,  // bottom-left
  ]);

  // 2D image points from detected corners
  const imagePoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    marker.corners[0].x, marker.corners[0].y,
    marker.corners[1].x, marker.corners[1].y,
    marker.corners[2].x, marker.corners[2].y,
    marker.corners[3].x, marker.corners[3].y,
  ]);

  const { fx, fy, cx, cy } = DEFAULT_CAMERA_INTRINSICS;
  const cameraMat = cv.matFromArray(3, 3, cv.CV_64FC1, [
    fx, 0,  cx,
    0,  fy, cy,
    0,  0,  1,
  ]);
  const distCoeffs = cv.matFromArray(5, 1, cv.CV_64FC1, [...DEFAULT_DIST_COEFFS]);
  const rvec = new cv.Mat();
  const tvec = new cv.Mat();
  const rotMat = new cv.Mat();

  try {
    const ok = cv.solvePnP(
      objectPoints,
      imagePoints,
      cameraMat,
      distCoeffs,
      rvec,
      tvec,
      false,
      cv.SOLVEPNP_IPPE_SQUARE,
    );
    if (!ok) return null;

    // Extract rvec/tvec values
    const rv: [number, number, number] = [
      rvec.data64F[0],
      rvec.data64F[1],
      rvec.data64F[2],
    ];
    const tv: [number, number, number] = [
      tvec.data64F[0],
      tvec.data64F[1],
      tvec.data64F[2],
    ];

    // Convert rotation vector to matrix
    cv.Rodrigues(rvec, rotMat);

    // Camera position in marker frame: -R^T * t
    const R = rotMat.data64F;
    // R is 3x3 row-major: R[0..2] = row0, R[3..5] = row1, R[6..8] = row2
    const camInMarker: Point3D = {
      x: -(R[0] * tv[0] + R[3] * tv[1] + R[6] * tv[2]),
      y: -(R[1] * tv[0] + R[4] * tv[1] + R[7] * tv[2]),
      z: -(R[2] * tv[0] + R[5] * tv[1] + R[8] * tv[2]),
    };

    // Transform camera position from marker-local to world coordinates
    const worldPos = markerToWorld(camInMarker, def.center, def.rotationToWorld);

    // Camera rotation: R^T * C converts marker→OpenCV rotation to
    // Three.js camera orientation in marker frame, then R_m2w rotates to world.
    const worldRotMat = cameraRotationInWorld(R, def.rotationToWorld);
    const worldRot = rotationMatrixToEuler(worldRotMat);

    return {
      position: worldPos,
      rotation: worldRot,
      rvec: rv,
      tvec: tv,
      markerId: marker.id,
    };
  } finally {
    objectPoints.delete();
    imagePoints.delete();
    cameraMat.delete();
    distCoeffs.delete();
    rvec.delete();
    tvec.delete();
    rotMat.delete();
  }
}

// ============================================================
// Pose fusion (multiple markers)
// ============================================================

/**
 * Fuse multiple single-marker pose estimations into one PoseResult
 * by averaging positions and rotations.
 */
export function fusePoses(poses: PoseEstimation[]): PoseResult {
  if (poses.length === 0) {
    return {
      poses: [],
      cameraPosition: { x: 0, y: 0, z: 0 },
      cameraRotation: { x: 0, y: 0, z: 0 },
      detectedMarkerIds: [],
      timestamp: Date.now(),
    };
  }

  const n = poses.length;
  const avgPos: Point3D = {
    x: poses.reduce((s, p) => s + p.position.x, 0) / n,
    y: poses.reduce((s, p) => s + p.position.y, 0) / n,
    z: poses.reduce((s, p) => s + p.position.z, 0) / n,
  };
  const avgRot: EulerAngles = {
    x: poses.reduce((s, p) => s + p.rotation.x, 0) / n,
    y: poses.reduce((s, p) => s + p.rotation.y, 0) / n,
    z: poses.reduce((s, p) => s + p.rotation.z, 0) / n,
  };

  return {
    poses,
    cameraPosition: avgPos,
    cameraRotation: avgRot,
    detectedMarkerIds: poses.map((p) => p.markerId),
    timestamp: Date.now(),
  };
}

// ============================================================
// Coordinate transform helpers
// ============================================================

/**
 * Transform a point from marker-local coordinates to world coordinates.
 * Applies rotation (Euler XYZ in radians) then translation.
 */
function markerToWorld(
  point: Point3D,
  markerCenter: Point3D,
  rot: EulerAngles,
): Point3D {
  const { x: rx, y: ry, z: rz } = rot;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);

  // Rotation matrix (ZYX convention: Rz * Ry * Rx)
  const { x, y, z } = point;

  // Apply Rx
  const y1 = cx * y - sx * z;
  const z1 = sx * y + cx * z;
  // Apply Ry
  const x2 = cy * x + sy * z1;
  const z2 = -sy * x + cy * z1;
  // Apply Rz
  const x3 = cz * x2 - sz * y1;
  const y3 = sz * x2 + cz * y1;

  return {
    x: x3 + markerCenter.x,
    y: y3 + markerCenter.y,
    z: z2 + markerCenter.z,
  };
}

/**
 * Extract Euler angles (degrees) from a 3x3 rotation matrix (row-major Float64Array).
 * Uses the convention: R = Rz * Ry * Rx
 */
function rotationMatrixToEuler(R: Float64Array): EulerAngles {
  const sy = Math.sqrt(R[0] * R[0] + R[3] * R[3]);
  const singular = sy < 1e-6;

  let x: number, y: number, z: number;
  if (!singular) {
    x = Math.atan2(R[7], R[8]);
    y = Math.atan2(-R[6], sy);
    z = Math.atan2(R[3], R[0]);
  } else {
    x = Math.atan2(-R[5], R[4]);
    y = Math.atan2(-R[6], sy);
    z = 0;
  }

  const RAD2DEG = 180 / Math.PI;
  return { x: x * RAD2DEG, y: y * RAD2DEG, z: z * RAD2DEG };
}

/**
 * Compute the Three.js camera rotation matrix in world coordinates.
 *
 * @param R  3×3 row-major Float64Array — marker→OpenCV-camera rotation (from solvePnP/Rodrigues)
 * @param markerRot  marker's rotationToWorld Euler angles (radians)
 * @returns 3×3 row-major Float64Array — camera rotation matrix in world frame
 *
 * Steps:
 *  1. R^T * C  (C = diag(1,-1,-1)) converts from OpenCV camera convention
 *     (Y-down, Z-forward) to Three.js camera convention (Y-up, Z-backward),
 *     expressed in the marker-local frame.
 *  2. R_m2w * (R^T * C) rotates into world coordinates.
 */
function cameraRotationInWorld(R: Float64Array, markerRot: EulerAngles): Float64Array {
  // --- Step 1: RtC = R^T * diag(1, -1, -1) ---
  // RtC[i][j] = R^T[i][j] * C[j][j]
  //   j=0: R^T[i][0] =  R[0*3+i]
  //   j=1: -R^T[i][1] = -R[1*3+i]
  //   j=2: -R^T[i][2] = -R[2*3+i]
  const RtC = new Float64Array(9);
  for (let i = 0; i < 3; i++) {
    RtC[i * 3 + 0] =  R[0 * 3 + i];
    RtC[i * 3 + 1] = -R[1 * 3 + i];
    RtC[i * 3 + 2] = -R[2 * 3 + i];
  }

  // --- Step 2: build R_m2w = Rz * Ry * Rx from marker Euler angles ---
  const { x: rx, y: ry, z: rz } = markerRot;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);

  //  Row-major Rz·Ry·Rx
  const m00 = cz * cy,  m01 = cz * sy * sx - sz * cx,  m02 = cz * sy * cx + sz * sx;
  const m10 = sz * cy,  m11 = sz * sy * sx + cz * cx,  m12 = sz * sy * cx - cz * sx;
  const m20 = -sy,       m21 = cy * sx,                  m22 = cy * cx;

  // --- Step 3: result = R_m2w * RtC ---
  const Rm2w = [m00, m01, m02, m10, m11, m12, m20, m21, m22];
  const out = new Float64Array(9);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      out[i * 3 + j] =
        Rm2w[i * 3 + 0] * RtC[0 * 3 + j] +
        Rm2w[i * 3 + 1] * RtC[1 * 3 + j] +
        Rm2w[i * 3 + 2] * RtC[2 * 3 + j];
    }
  }

  return out;
}
