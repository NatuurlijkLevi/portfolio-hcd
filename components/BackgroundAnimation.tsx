"use client";
import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import BackgroundWrapper from "./BackgroundWrapper";

type MeshProps = ThreeElements["mesh"];

function AmpHead(props: MeshProps) {
  const { viewport } = useThree();
  const viewportWidth = viewport.width;
  const w = viewportWidth * 0.17;
  const h = w * 0.45;
  const d = w * 0.4;
  return (
    <mesh {...props}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

function AmpCab(props: MeshProps) {
  const { viewport } = useThree();
  const viewportWidth = viewport.width;
  const w = viewportWidth * 0.17;
  const h = w * 0.9;
  const d = w * 0.4;
  return (
    <mesh {...props}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

function ScrollListener({
  children,
  scrollProgress,
}: {
  children: React.ReactNode;
  scrollProgress: React.MutableRefObject<number>;
}) {
  const scrollProgressRef = useRef(scrollProgress);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      scrollProgressRef.current.current =
        scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    };

    // Set the initial value and keep it updated while the user scrolls.
    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });

    // Remove the listener when this component is unmounted.
    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
    };
  }, []);
  return <div>{children}</div>;
}

function ScrollMotion({
  children,
  scrollProgress,
  percentageFrom = 0,
  percentageTo = 100,
  targetRotation = {},
  targetPosition = {},
}: {
  children: React.ReactNode;
  scrollProgress: React.MutableRefObject<number>;
  percentageFrom?: number;
  percentageTo?: number;
  targetRotation?: {
    x?: number;
    y?: number;
    z?: number;
  };
  targetPosition?: {
    x?: number;
    y?: number;
    z?: number;
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

    // Move toward the targets gradually instead of jumping on every scroll event.
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      rotationTarget.x,
      4,
      delta,
    );
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      rotationTarget.y,
      4,
      delta,
    );
    group.current.rotation.z = THREE.MathUtils.damp(
      group.current.rotation.z,
      rotationTarget.z,
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

export default function BackgroundAnimation() {
  const scrollProgress = useRef(0);
  return (
    <ScrollListener scrollProgress={scrollProgress}>
      <BackgroundWrapper>
        <Canvas>
          <ambientLight />
          {/* Keeps the objects in front of the camera while ScrollMotion animates them. */}
          <group position={[0, 0, 3.65]}>
            <ScrollMotion
              scrollProgress={scrollProgress}
              percentageFrom={0}
              percentageTo={100}
              targetRotation={{ x: 0, y: -Math.PI * 0.375, z: 0 }}
              targetPosition={{ x: 5, y: 1, z: -5 }}
            >
              <AmpHead position={[0, 0, 0]} />
              <AmpCab position={[0, -1.95, 0]} />
            </ScrollMotion>
          </group>
        </Canvas>
      </BackgroundWrapper>
    </ScrollListener>
  );
}
