"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import BackgroundWrapper from "./BackgroundWrapper";
import { degreeToRadian } from "./degreeToRadianTools";
import ScrollListener from "./ScrollListener";
import ScrollMotion from "./ScrollMotion";
import HtmlPlane from "./HtmlPlane";
import { montserratSubrayada } from "@/app/fonts/montserrat";
import NextImage from "next/image";
import { lobster } from "@/app/fonts/lobster";
type Vec3 = [number, number, number];
type Vec2 = [number, number];

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

function PortfolioPrinter()
{
  const { scene } = useGLTF("/3d/portfolio-printer2.glb");

  return (
    <primitive object={scene}></primitive>
  );
}

function PortfolioComputer()
{
  const { scene } = useGLTF("/3d/portfolio-computer.glb");

  return (
    <primitive object={scene}></primitive>
  );
}

export default function BackgroundAnimation({
  modelPosition = [0, 0, 0],
  screenOffset = [0, 0]
}: {
  /** World-space position of the model. */
  modelPosition?: Vec3;
  /** Screen placement in NDC: x right, y up. [0, 0] keeps the default framing. */
  screenOffset?: Vec2;
  onKnobClick?: (label: string, index: number) => void;
})
{
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
          // gl={{ alpha: true }}
          // onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
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
                [10, [0, -45, 0], [5, 1, -10]],
                [15, [0, -45, 0], [20, 1, -10]],
              ]}>
              <group position={modelPosition}>
                <group rotation={[0, degreeToRadian(-90), 0]}>
                  <PortfolioAmp
                    modelPosition={modelPosition}
                    screenOffset={screenOffset}
                  />
                </group>
                <HtmlPlane
                  position={[-1.8, 6, LABEL_SURFACE_Z]}
                  width={3.6}
                  height={0.5}
                  pixelsPerUnit={200}
                  renderPlane={false}
                >
                  <div
                    className={"text-neutral-200 w-full h-full flex items-end justify-start text-2xl font-bold gap-52"}
                  >
                    <div className={"flex pt-2 flex-col items-start justify-between h-full"}>
                      <NextImage className="grayscale" src="/logo.svg" alt="Logo" width={32} height={32}></NextImage>
                      <span className={montserratSubrayada.className}>Portfolio</span>
                    </div>
                    <ul className="uppercase text-sm flex text-center gap-2 pb-1 *:w-16">
                      <li>Tone</li>
                      <li>Gain</li>
                      <li>Volume</li>
                      <li>Master</li>
                    </ul>
                  </div>
                </HtmlPlane>
                <HtmlPlane
                  position={[-1.8, 5.5, LABEL_SURFACE_Z]}
                  width={3.6}
                  height={5.2}
                  pixelsPerUnit={200}
                  renderPlane={false}
                >
                  <div className={lobster.className + " text-neutral-200 h-full flex flex-col gap-20 *:text-2xl *:w-full *:flex *:items-center *:justify-center"}>
                    <div className="h-86">
                      <span>Levi Meijer</span>
                    </div>
                    <div className="h-full">
                      <span>Levi Meijer</span>
                    </div>
                  </div>
                </HtmlPlane>
              </group>
            </ScrollMotion>
            <ScrollMotion
              scrollProgress={scrollProgress}
              keyframes={[
                [0, [0, -45, 0], [20, 3.5, -15]],
                [15, [0, -45, 0], [20, 3.5, -15]],
                [20, [0, -45, 0], [-3, 3.5, -15]],
                [30, [0, -45, 0], [-3, 3.5, -15]],
                [35, [0, -45, 0], [20, 3.5, -15]],
              ]}>
              <group rotation={[0, degreeToRadian(-90), 0]}>
                <PortfolioPrinter />
              </group>
            </ScrollMotion>
            <ScrollMotion
              scrollProgress={scrollProgress}
              keyframes={[
                [0, [0, -45, 0], [20, 4, -5]],
                [35, [0, -45, 0], [20, 4, -5]],
                [40, [0, -45, 0], [4, 4, -5]],
                [50, [0, -45, 0], [4, 4, -5]],
                [55, [0, 0, 0], [0, 4, -5]],
                [60, [0, 0, 0], [0, 4, 2]],
                [80, [0, 0, 0], [0, 4, 2]],
                [85, [0, 0, 0], [0, 4, -1]],
                [90, [0, 0, 0], [0, 10, -1]],
              ]}>
              <group rotation={[0, degreeToRadian(-90), 0]}>
                <PortfolioComputer />
              </group>
            </ScrollMotion>
          </Suspense>
        </Canvas>
      </ScrollListener>
    </BackgroundWrapper>
  );
}
