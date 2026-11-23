"use client";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { degreeArraytoEuler } from "./degreeToRadianTools";

type Vec3 = { x: number; y: number; z: number };
type Vec3Input = Vec3 | [number, number, number] | undefined;

/**
 * [scroll percentage, rotation in degrees, position]
 * Rotation and position can be `{ x, y, z }` or `[x, y, z]`.
 *
 * @example
 * [
 *   [0, [0, 0, 0], [0, 0, 0]],
 *   [50, [90, 0, 0], [5, 1, -5]],
 *   [100, [90, 0, 0], [0, 0, -10]],
 * ]
 */
export type ScrollKeyframe =
  | [percentage: number, rotation?: Vec3Input, position?: Vec3Input]
  | {
    percentage: number;
    rotation?: Vec3Input;
    position?: Vec3Input;
  };

type NormalizedKeyframe = {
  percentage: number;
  rotation: Vec3;
  position: Vec3;
};

const ZERO: Vec3 = { x: 0, y: 0, z: 0 };

function toVec3(value: Vec3Input): Vec3
{
  if (!value) return { ...ZERO };
  if (Array.isArray(value))
  {
    return { x: value[0] ?? 0, y: value[1] ?? 0, z: value[2] ?? 0 };
  }
  return { x: value.x ?? 0, y: value.y ?? 0, z: value.z ?? 0 };
}

function normalizeKeyframes(keyframes: ScrollKeyframe[]): NormalizedKeyframe[]
{
  // Keyframe percentages use 0–100, but scroll progress is 0–1.
  return keyframes
    .map((keyframe): NormalizedKeyframe =>
    {
      if (Array.isArray(keyframe))
      {
        return {
          percentage: keyframe[0] / 100,
          rotation: toVec3(keyframe[1]),
          position: toVec3(keyframe[2]),
        };
      }
      return {
        percentage: keyframe.percentage / 100,
        rotation: toVec3(keyframe.rotation),
        position: toVec3(keyframe.position),
      };
    })
    .sort((a, b) => a.percentage - b.percentage);
}

function lerpVec3(from: Vec3, to: Vec3, t: number): Vec3
{
  return {
    x: THREE.MathUtils.lerp(from.x, to.x, t),
    y: THREE.MathUtils.lerp(from.y, to.y, t),
    z: THREE.MathUtils.lerp(from.z, to.z, t),
  };
}

function sampleKeyframes(
  keyframes: NormalizedKeyframe[],
  progress: number,
): { rotation: Vec3; position: Vec3 }
{
  const first = keyframes[0];
  if (!first) return { rotation: { ...ZERO }, position: { ...ZERO } };
  if (progress <= first.percentage)
  {
    return { rotation: first.rotation, position: first.position };
  }

  for (let i = 0; i < keyframes.length - 1; i++)
  {
    const from = keyframes[i];
    const to = keyframes[i + 1];
    if (progress > to.percentage) continue;

    const span = to.percentage - from.percentage;
    const t =
      span === 0
        ? 1
        : THREE.MathUtils.clamp((progress - from.percentage) / span, 0, 1);
    return {
      rotation: lerpVec3(from.rotation, to.rotation, t),
      position: lerpVec3(from.position, to.position, t),
    };
  }

  const last = keyframes[keyframes.length - 1];
  return { rotation: last.rotation, position: last.position };
}

export default function ScrollMotion({
  children,
  scrollProgress,
  percentageFrom = 0,
  percentageTo = 100,
  targetRotation = ZERO,
  targetPosition = ZERO,
  keyframes,
}: {
  children: React.ReactNode;
  scrollProgress?: React.MutableRefObject<number>;
  percentageFrom?: number;
  percentageTo?: number;
  targetRotation?: Vec3;
  targetPosition?: Vec3;
  keyframes?: ScrollKeyframe[];
})
{
  // Refs let us update Three.js values without causing React re-renders.
  const group = useRef<THREE.Group>(null);
  const fallbackProgress = useRef(0);
  const progressRef = scrollProgress ?? fallbackProgress;

  // Without explicit keyframes, the old props describe a two-keyframe track:
  // zero at `percentageFrom`, then the target at `percentageTo`.
  const frames = useMemo(
    () =>
      normalizeKeyframes(
        keyframes ?? [
          [percentageFrom, ZERO, ZERO],
          [percentageTo, targetRotation, targetPosition],
        ],
      ),
    [keyframes, percentageFrom, percentageTo, targetRotation, targetPosition],
  );

  useFrame((_, delta) =>
  {
    if (!group.current) return;

    const { rotation, position } = sampleKeyframes(
      frames,
      progressRef.current,
    );
    const movementSuddenty = 4;
    const targetRotationPI = degreeArraytoEuler(rotation);

    // Move toward the targets gradually instead of jumping on every scroll event.
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      targetRotationPI.x,
      movementSuddenty,
      delta,
    );
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      targetRotationPI.y,
      movementSuddenty,
      delta,
    );
    group.current.rotation.z = THREE.MathUtils.damp(
      group.current.rotation.z,
      targetRotationPI.z,
      movementSuddenty,
      delta,
    );
    group.current.position.x = THREE.MathUtils.damp(
      group.current.position.x,
      position.x,
      movementSuddenty,
      delta,
    );
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      position.y,
      movementSuddenty,
      delta,
    );
    group.current.position.z = THREE.MathUtils.damp(
      group.current.position.z,
      position.z,
      movementSuddenty,
      delta,
    );
  });

  return <group ref={group}>{children}</group>;
}
