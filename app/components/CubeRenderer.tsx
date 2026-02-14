"use client";

import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import type { PoseResult } from "@/lib/types";
import {
  CUBE_SIZE,
  MARKER_SIZE,
  MARKER_DEFINITIONS,
  VIRTUAL_CUBE_COLOR,
  VIRTUAL_CUBE_OPACITY,
} from "@/lib/constants";
import styles from "./CubeRenderer.module.css";

interface CubeRendererProps {
  /** Pose data to position the Three.js camera */
  pose: PoseResult | null;
  /** Whether the renderer is active */
  active?: boolean;
}

interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  animFrameId: number;
}

export default function CubeRenderer({
  pose,
  active = true,
}: CubeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneRefs | null>(null);

  const buildScene = useCallback(() => {
    const scene = new THREE.Scene();

    // -- Virtual cube (translucent) --
    const cubeGeo = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: VIRTUAL_CUBE_COLOR,
      transparent: true,
      opacity: VIRTUAL_CUBE_OPACITY,
      side: THREE.DoubleSide,
    });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    scene.add(cube);

    // -- Wireframe edges --
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(cubeGeo),
      new THREE.LineBasicMaterial({ color: 0x88bbff, linewidth: 1 })
    );
    scene.add(edges);

    // -- Marker faces visualisation --
    for (const def of MARKER_DEFINITIONS) {
      const markerGeo = new THREE.PlaneGeometry(MARKER_SIZE, MARKER_SIZE);
      const markerMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);

      // Position at the face center, slightly offset outward to avoid z-fighting
      const offset = 0.001;
      marker.position.set(
        def.center.x + def.normal.x * offset,
        def.center.y + def.normal.y * offset,
        def.center.z + def.normal.z * offset
      );

      // Orient the plane to face outward
      marker.lookAt(
        def.center.x + def.normal.x,
        def.center.y + def.normal.y,
        def.center.z + def.normal.z
      );

      scene.add(marker);
    }

    // -- Grid (XZ plane) --
    const grid = new THREE.GridHelper(1, 10, 0x444466, 0x333344);
    scene.add(grid);

    // -- Axes helper (X=red, Y=green, Z=blue) --
    scene.add(new THREE.AxesHelper(0.3));

    // -- Lighting --
    scene.add(new THREE.AmbientLight(0x404060, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 2, 1.5);
    scene.add(dirLight);

    return scene;
  }, []);

  // Initialise / dispose Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a14);
    container.appendChild(renderer.domElement);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100);
    // Default viewpoint: slightly above and in front
    camera.position.set(0.3, 0.25, 0.4);
    camera.lookAt(0, 0, 0);

    // Scene
    const scene = buildScene();

    // Sizing
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Render loop
    let animFrameId = 0;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    sceneRef.current = { renderer, scene, camera, animFrameId };

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, [active, buildScene]);

  // Update camera from pose
  useEffect(() => {
    if (!pose || !sceneRef.current) return;
    const { camera } = sceneRef.current;

    // Apply pose: position + rotation (degrees → radians)
    camera.position.set(
      pose.cameraPosition.x,
      pose.cameraPosition.y,
      pose.cameraPosition.z
    );

    camera.rotation.set(
      THREE.MathUtils.degToRad(pose.cameraRotation.x),
      THREE.MathUtils.degToRad(pose.cameraRotation.y),
      THREE.MathUtils.degToRad(pose.cameraRotation.z)
    );
  }, [pose]);

  return <div ref={containerRef} className={styles.container} />;
}
