"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { LoadingState } from "@/lib/types";

const OPENCV_CDN_URL =
  "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.10.0-release.1/dist/opencv.js";

const POLL_INTERVAL = 200;
const LOAD_TIMEOUT = 60_000;

interface OpenCVContextValue {
  cv: OpenCV | null;
  status: LoadingState;
  error: string | null;
}

const OpenCVContext = createContext<OpenCVContextValue>({
  cv: null,
  status: "loading",
  error: null,
});

export function useOpenCV() {
  return useContext(OpenCVContext);
}

interface OpenCVProviderProps {
  children: ReactNode;
}

/**
 * Inject the script tag once (module-level flag survives HMR/StrictMode).
 * Returns immediately — the actual readiness is detected by polling.
 */
let scriptInjected = false;
function ensureScriptTag() {
  if (scriptInjected) return;
  if (document.querySelector(`script[src="${OPENCV_CDN_URL}"]`)) {
    scriptInjected = true;
    return;
  }
  const script = document.createElement("script");
  script.src = OPENCV_CDN_URL;
  script.async = true;
  document.head.appendChild(script);
  scriptInjected = true;
}

/**
 * Provides the OpenCV.js runtime to the component tree.
 *
 * Loads opencv.js from CDN via script tag injection, then polls for
 * `window.cv.Mat` to detect when the WASM/asm.js runtime is ready.
 * This polling approach is robust against all Emscripten init patterns.
 */
export function OpenCVProvider({ children }: OpenCVProviderProps) {
  const [status, setStatus] = useState<LoadingState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [cv, setCv] = useState<OpenCV | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;

    // Already ready (HMR reload)
    if (win.cv && win.cv.Mat) {
      setCv(win.cv);
      setStatus("ready");
      return;
    }

    ensureScriptTag();

    const start = Date.now();
    const timer = setInterval(() => {
      // Check for timeout
      if (Date.now() - start > LOAD_TIMEOUT) {
        clearInterval(timer);
        setError("OpenCV.js initialization timed out");
        setStatus("error");
        return;
      }

      // Check if script failed (tag exists but errored)
      const scriptEl = document.querySelector(
        `script[src="${OPENCV_CDN_URL}"]`,
      ) as HTMLScriptElement | null;
      if (scriptEl && scriptEl.onerror === null && !win.cv && Date.now() - start > 15_000) {
        // After 15s with no cv object, likely a network failure
        clearInterval(timer);
        setError("Failed to load OpenCV.js from CDN");
        setStatus("error");
        return;
      }

      // Poll: cv object exists AND runtime is initialized (Mat constructor available)
      if (win.cv && typeof win.cv.Mat === "function") {
        clearInterval(timer);
        setCv(win.cv);
        setStatus("ready");
      }
    }, POLL_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  return (
    <OpenCVContext.Provider value={{ cv, status, error }}>
      {children}
    </OpenCVContext.Provider>
  );
}
