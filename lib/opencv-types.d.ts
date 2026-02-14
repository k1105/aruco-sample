/**
 * Minimal OpenCV.js type declarations for ArUco marker detection and pose estimation.
 * Covers: Mat, MatVector, aruco_ArucoDetector, aruco_Dictionary, aruco_DetectorParameters,
 *         solvePnP, Rodrigues, and supporting types.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare namespace cv {
  // ============================================================
  // Core: Mat
  // ============================================================
  class Mat {
    constructor();
    constructor(rows: number, cols: number, type: number);
    constructor(rows: number, cols: number, type: number, scalar: Scalar);
    rows: number;
    cols: number;
    data: Uint8Array;
    data32S: Int32Array;
    data32F: Float32Array;
    data64F: Float64Array;
    intAt(row: number, col: number): number;
    floatAt(row: number, col: number): number;
    doubleAt(row: number, col: number): number;
    delete(): void;
    isContinuous(): boolean;
    size(): { width: number; height: number };
    type(): number;
    clone(): Mat;
  }

  // ============================================================
  // Core: MatVector
  // ============================================================
  class MatVector {
    constructor();
    get(index: number): Mat;
    size(): number;
    delete(): void;
  }

  // ============================================================
  // Core: Scalar
  // ============================================================
  type Scalar = [number, number, number, number];

  // ============================================================
  // Core: Mat types
  // ============================================================
  const CV_8UC1: number;
  const CV_8UC3: number;
  const CV_8UC4: number;
  const CV_32FC1: number;
  const CV_32FC2: number;
  const CV_32FC3: number;
  const CV_64FC1: number;

  // ============================================================
  // Color conversion
  // ============================================================
  const COLOR_RGBA2GRAY: number;
  function cvtColor(src: Mat, dst: Mat, code: number): void;

  // ============================================================
  // Mat creation helpers
  // ============================================================
  function matFromImageData(imageData: ImageData): Mat;
  function matFromArray(rows: number, cols: number, type: number, data: number[]): Mat;

  // ============================================================
  // calib3d: solvePnP
  // ============================================================
  const SOLVEPNP_ITERATIVE: number;
  const SOLVEPNP_IPPE_SQUARE: number;

  function solvePnP(
    objectPoints: Mat,
    imagePoints: Mat,
    cameraMatrix: Mat,
    distCoeffs: Mat,
    rvec: Mat,
    tvec: Mat,
    useExtrinsicGuess?: boolean,
    flags?: number,
  ): boolean;

  function Rodrigues(src: Mat, dst: Mat): void;

  // ============================================================
  // ArUco (objdetect module, OpenCV 4.7+)
  // ============================================================
  function getPredefinedDictionary(dict: number): aruco_Dictionary;

  class aruco_Dictionary {
    constructor();
    constructor(bytesList: Mat, markerSize: number, maxcorr: number);
    delete(): void;
  }

  class aruco_DetectorParameters {
    constructor();
    delete(): void;
  }

  class aruco_RefineParameters {
    constructor(minRepDistance: number, errorCorrectionRate: number, checkAllOrders: boolean);
    delete(): void;
  }

  class aruco_ArucoDetector {
    constructor(dictionary: aruco_Dictionary, parameters: aruco_DetectorParameters, refineParams: aruco_RefineParameters);
    detectMarkers(
      image: Mat,
      corners: MatVector,
      ids: Mat,
      rejectedImgPoints?: MatVector,
    ): void;
    delete(): void;
  }

  // ArUco predefined dictionary IDs
  const DICT_4X4_50: number;
  const DICT_4X4_100: number;
  const DICT_4X4_250: number;
  const DICT_4X4_1000: number;
  const DICT_5X5_50: number;
  const DICT_6X6_50: number;
}

// The global cv object loaded by OpenCV.js
declare interface OpenCV extends Record<string, any> {
  Mat: typeof cv.Mat;
  MatVector: typeof cv.MatVector;
  matFromImageData: typeof cv.matFromImageData;
  matFromArray: typeof cv.matFromArray;
  cvtColor: typeof cv.cvtColor;
  solvePnP: typeof cv.solvePnP;
  Rodrigues: typeof cv.Rodrigues;
  getPredefinedDictionary: typeof cv.getPredefinedDictionary;
  aruco_Dictionary: typeof cv.aruco_Dictionary;
  aruco_DetectorParameters: typeof cv.aruco_DetectorParameters;
  aruco_RefineParameters: typeof cv.aruco_RefineParameters;
  aruco_ArucoDetector: typeof cv.aruco_ArucoDetector;
  COLOR_RGBA2GRAY: number;
  CV_8UC1: number;
  CV_8UC4: number;
  CV_32FC1: number;
  CV_32FC2: number;
  CV_32FC3: number;
  CV_64FC1: number;
  SOLVEPNP_ITERATIVE: number;
  SOLVEPNP_IPPE_SQUARE: number;
  DICT_4X4_50: number;
  onRuntimeInitialized?: () => void;
}
