"use client";
import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { degreeArraytoEuler } from "./degreeToRadianTools";

export default function ScrollMotion({
  children,
  scrollProgress,
  percentageFrom = 0,
  percentageTo = 100,
  targetRotation = { x: 0, y: 0, z: 0 },
  targetPosition = { x: 0, y: 0, z: 0 },
}: {
  children: React.ReactNode;
  scrollProgress: React.MutableRefObject<number>;
  percentageFrom?: number;
  percentageTo?: number;
  targetRotation?: {
    x: number;
    y: number;
    z: number;
  };
  targetPosition?: {
    x: number;
    y: number;
    z: number;
  };
}) {
  // Refs let us update Three.js values without causing React re-renders.
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;

    const progress = scrollProgress.current;
    const from = percentageFrom / 100;
    const to = percentageTo / 100;
    const keyframeProgress =
      to === from
        ? progress >= to
          ? 1
          : 0
        : THREE.MathUtils.clamp((progress - from) / (to - from), 0, 1);
    const rotationTarget = {
      x: (targetRotation.x ?? 0) * keyframeProgress,
      y: (targetRotation.y ?? 0) * keyframeProgress,
      z: (targetRotation.z ?? 0) * keyframeProgress,
    };
    const positionTarget = {
      x: (targetPosition.x ?? 0) * keyframeProgress,
      y: (targetPosition.y ?? 0) * keyframeProgress,
      z: (targetPosition.z ?? 0) * keyframeProgress,
    };

    const targetRotationPI = degreeArraytoEuler(rotationTarget);

    // Move toward the targets gradually instead of jumping on every scroll event.
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      targetRotationPI.x,
      4,
      delta,
    );
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      targetRotationPI.y,
      4,
      delta,
    );
    group.current.rotation.z = THREE.MathUtils.damp(
      group.current.rotation.z,
      targetRotationPI.z,
      4,
      delta,
    );
    group.current.position.x = THREE.MathUtils.damp(
      group.current.position.x,
      positionTarget.x,
      4,
      delta,
    );
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      positionTarget.y,
      4,
      delta,
    );
    group.current.position.z = THREE.MathUtils.damp(
      group.current.position.z,
      positionTarget.z,
      4,
      delta,
    );
  });

  return <group ref={group}>{children}</group>;
}
