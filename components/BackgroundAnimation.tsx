"use client";
import React, {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import BackgroundWrapper from "./BackgroundWrapper";
import { degreeToRadian } from "./degreeToRadianTools";

type GroupProps = ThreeElements["group"];

function FitModelWidth({
  object,
  camera,
  viewportWidth,
  viewportHeight,
}: {
  object: THREE.Object3D;
  camera: THREE.Camera;
  viewportWidth: number;
  viewportHeight: number;
}) {
  const scene = useThree((s) => s.scene);
  const size = useThree((s) => s.size); // ← guaranteed to match renderer
  const lastSize = useRef({ w: 0, h: 0 });
  const [fitted, setFitted] = useState(false);

  useFrame(() => {
    if (lastSize.current.w === size.width && lastSize.current.h === size.height)
      return;
    lastSize.current = { w: size.width, h: size.height };
    if (!fitted) setFitted(true);

    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();

    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const modelWidth = box.max.x - box.min.x;
    if (modelWidth === 0) return;

    const modelTopY = box.max.y;
    const modelCenterX = (box.min.x + box.max.x) / 2;
    const modelZ = (box.min.z + box.max.z) / 2;

    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const aspect = size.width / size.height;

    // Distance that fits the model to width at the current aspect
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const rawDistance = (modelWidth / 2 / Math.tan(hFov / 2)) * 1.02 + modelZ;

    // Cap: beyond this aspect, the model stays at the size it would be at refAspect
    const refAspect = 1.2; // tune this — the aspect where "full width" looks good
    const refHFov = 2 * Math.atan(Math.tan(vFov / 2) * refAspect);
    const maxDistance =
      (modelWidth / 2 / Math.tan(refHFov / 2)) * 1.02 + modelZ;

    const distance = Math.min(rawDistance, maxDistance);

    const visibleHeight = 2 * Math.tan(vFov / 2) * (distance - modelZ);
    const targetY = 1.065 * modelTopY - visibleHeight / 2;

    camera.position.set(modelCenterX, targetY, distance);
    camera.lookAt(modelCenterX, targetY, modelZ);
    camera.updateProjectionMatrix();
  });
  return <primitive object={object} visible={fitted} />;
}

function PortfolioAmp(props: GroupProps) {
  const { scene } = useGLTF("/3d/portfolio-amp2.glb");
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  return (
    <group {...props}>
      <FitModelWidth
        object={scene}
        camera={camera}
        viewportWidth={size.width}
        viewportHeight={size.height}
      />
    </group>
  );
}

function PortfolioPrinter(props: GroupProps) {
  const { scene } = useGLTF("/3d/portfolio-printer2.glb");
  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  );
}
function PortfolioComputer(props: GroupProps) {
  const { scene } = useGLTF("/3d/portfolio-computer.glb");
  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  );
}

export default function BackgroundAnimation() {
  // const scrollProgress = useRef(0);
  return (
    // <ScrollListener scrollProgress={scrollProgress}>
    <BackgroundWrapper>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 100000 }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Keeps the objects in front of the camera while ScrollMotion animates them. */}
        {/* <group position={[0, 0, 3.65]}> */}
        {/* <ScrollMotion
              scrollProgress={scrollProgress}
              percentageFrom={0}
              percentageTo={50}
              targetRotation={{ x: 0, y: -90, z: 0 }}
              targetPosition={{ x: 5, y: 1, z: -5 }}
            > */}
        <Suspense fallback={null}>
          <ambientLight />
          <hemisphereLight intensity={1.5} />
          <directionalLight position={[10, 10, 10]} intensity={2} />
          <group rotation={[0, degreeToRadian(-90), 0]}>
            <PortfolioAmp position={[0, 0, 0]} />
          </group>
        </Suspense>
        {/* </ScrollMotion> */}
        {/* </group> */}
      </Canvas>
    </BackgroundWrapper>
  );
}
