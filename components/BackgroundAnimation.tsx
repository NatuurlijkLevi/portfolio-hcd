"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import BackgroundWrapper from "./BackgroundWrapper";
import { degreeToRadian } from "./degreeToRadianTools";
import ScrollListener from "./ScrollListener";
import ScrollMotion from "./ScrollMotion";

type Vec3 = [number, number, number];
type Vec2 = [number, number];

// Knob positions in world units, measured from the amp after its -90° Y turn.
const KNOBS: { label: string; position: Vec3 }[] = [
  { label: "VOLUME", position: [0.11, 5.84, 1.04] },
  { label: "GAIN", position: [0.45, 5.84, 1.04] },
  { label: "TONE", position: [0.78, 5.84, 1.04] },
  { label: "MASTER", position: [1.125, 5.84, 1.04] },
];

// The panel surface below the knobs is at z = 1.0 (raycast from the amp mesh).
// A tiny offset keeps the text from z-fighting with the panel.
const LABEL_SURFACE_Z = 1.002;

function FitModelWidth({
  object,
  modelPosition,
  screenOffset,
}: {
  object: THREE.Object3D;
  modelPosition: Vec3;
  screenOffset: Vec2;
})
{
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const lastFit = useRef("");
  const [fitted, setFitted] = useState(false);

  useFrame(() =>
  {
    const fitKey = `${size.width}|${size.height}|${modelPosition.join(",")}|${screenOffset.join(",")}`;
    if (lastFit.current === fitKey) return;
    lastFit.current = fitKey;
    if (!fitted) setFitted(true);

    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    // Include the parent group's rotation, otherwise the model is measured
    // before it turns sideways and only a fraction of its width is used.
    object.updateWorldMatrix(true, true);
    const modelCenter = new THREE.Box3()
      .setFromObject(object)
      .getCenter(new THREE.Vector3());

    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (size.width / size.height));
    const tanHalfH = Math.tan(hFov / 2);
    const tanHalfV = Math.tan(vFov / 2);

    // Find the camera distance that puts the widest visible vertices exactly
    // at the left and right edges. Using the bounding box instead leaves gaps,
    // because its extreme corners aren't necessarily part of the mesh.
    const vertex = new THREE.Vector3();
    let distance = 0;
    let topEdge = -Infinity;
    object.traverse((child) =>
    {
      if (!(child instanceof THREE.Mesh)) return;
      const positions = child.geometry.getAttribute("position");
      if (!positions) return;
      for (let i = 0; i < positions.count; i++)
      {
        vertex.fromBufferAttribute(positions, i).applyMatrix4(child.matrixWorld);
        const depthOffset = vertex.z - modelCenter.z;
        distance = Math.max(
          distance,
          Math.abs(vertex.x - modelCenter.x) / tanHalfH + depthOffset
        );
        topEdge = Math.max(topEdge, vertex.y + depthOffset * tanHalfV);
      }
    });
    if (distance === 0) return;

    // Align the highest vertex with the top of the viewport, then shift the
    // camera to place the model wherever screenOffset asks for it.
    const cameraY = topEdge - distance * tanHalfV;
    camera.position.set(
      modelCenter.x - screenOffset[0] * distance * tanHalfH,
      cameraY - screenOffset[1] * distance * tanHalfV,
      modelCenter.z + distance,
    );
    camera.lookAt(camera.position.x, camera.position.y, modelCenter.z);
  });

  return <primitive object={object} visible={fitted} />;
}

function PortfolioAmp({
  modelPosition,
  screenOffset,
}: {
  modelPosition: Vec3;
  screenOffset: Vec2;
})
{
  const { scene } = useGLTF("/3d/portfolio-amp2.glb");

  return (
    <FitModelWidth
      object={scene}
      modelPosition={modelPosition}
      screenOffset={screenOffset}
    />
  );
}

export default function BackgroundAnimation({
  modelPosition = [0, 0, 0],
  screenOffset = [0, 0],
  onKnobClick,
}: {
  /** World-space position of the model. */
  modelPosition?: Vec3;
  /** Screen placement in NDC: x right, y up. [0, 0] keeps the default framing. */
  screenOffset?: Vec2;
  onKnobClick?: (label: string, index: number) => void;
})
{
  const [activeKnob, setActiveKnob] = useState<number | null>(null);
  const scrollProgress = useRef(0);

  useEffect(() =>
  {
    return () =>
    {
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <BackgroundWrapper>
      <ScrollListener scrollProgress={scrollProgress}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 100000 }}
          style={{ width: "100%", height: "100%" }}
        >
          <Suspense fallback={null}>
            <ambientLight />
            <hemisphereLight intensity={1.5} />
            <directionalLight position={[10, 10, 10]} intensity={2} />
            <ScrollMotion
              scrollProgress={scrollProgress}
              keyframes={[
                [0, [0, 0, 0], [0, 0, 0]],
                [100, [0, -45, 0], [5, 1, -10]]
              ]}>
              <group position={modelPosition}>
                <group rotation={[0, degreeToRadian(-90), 0]}>
                  <PortfolioAmp
                    modelPosition={modelPosition}
                    screenOffset={screenOffset}
                  />
                </group>
                {KNOBS.map((knob, index) => (
                  <group key={knob.label}>
                    {/* Invisible hit area: the knobs are baked into the GLB mesh. */}
                    <mesh
                      position={knob.position}
                      onClick={(event) =>
                      {
                        event.stopPropagation();
                        setActiveKnob(index);
                        onKnobClick?.(knob.label, index);
                      }}
                      onPointerOver={(event) =>
                      {
                        event.stopPropagation();
                        document.body.style.cursor = "pointer";
                      }}
                      onPointerOut={() =>
                      {
                        document.body.style.cursor = "auto";
                      }}
                    >
                      <sphereGeometry args={[0.14, 16, 16]} />
                      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <Text
                      position={[knob.position[0], knob.position[1] - 0.28, LABEL_SURFACE_Z]}
                      fontSize={0.05}
                      color={activeKnob === index ? "#ffd166" : "#ffffff"}
                      anchorX="center"
                      anchorY="middle"
                      raycast={() => null}
                    >
                      {knob.label}
                    </Text>
                    {activeKnob === index && (
                      <mesh
                        position={[knob.position[0], knob.position[1], 1.096]}
                        raycast={() => null}
                      >
                        <ringGeometry args={[0.16, 0.19, 32]} />
                        <meshBasicMaterial
                          color="#ffd166"
                          transparent
                          opacity={0.9}
                          side={THREE.DoubleSide}
                          depthWrite={false}
                        />
                      </mesh>
                    )}
                  </group>
                ))}
              </group>
            </ScrollMotion>
          </Suspense>
        </Canvas>
      </ScrollListener>
    </BackgroundWrapper>
  );
}
