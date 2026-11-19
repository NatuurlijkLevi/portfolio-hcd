"use client";
import React, { Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import BackgroundWrapper from "./BackgroundWrapper";

type GroupProps = ThreeElements["group"];

// function AmpHead(props: MeshProps)
// {
//   const { viewport } = useThree();
//   const viewportWidth = viewport.width;
//   const w = viewportWidth * 0.17;
//   const h = w * 0.45;
//   const d = w * 0.4;
//   return (
//     <mesh {...props}>
//       <boxGeometry args={[w, h, d]} />
//       <meshStandardMaterial color="hotpink" />
//     </mesh>
//   );
// }

// function AmpCab(props: MeshProps)
// {
//   const { viewport } = useThree();
//   const viewportWidth = viewport.width;
//   const w = viewportWidth * 0.17;
//   const h = w * 0.9;
//   const d = w * 0.4;
//   return (
//     <mesh {...props}>
//       <boxGeometry args={[w, h, d]} />
//       <meshStandardMaterial color="hotpink" />
//     </mesh>
//   );
// }

function degreeToRadian(degree: number)
{
  return degree / 180 * Math.PI;
}

function degreeArraytoEuler(rotation: { x: number; y: number; z: number })
{
  return {
    x: degreeToRadian(rotation.x),
    y: degreeToRadian(rotation.y),
    z: degreeToRadian(rotation.z)
  };
}

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
})
{
  const scene = useThree((s) => s.scene);
  const lastSize = useRef({ w: 0, h: 0 });

  useFrame(() =>
  {
    // Re-fit only on first frame or resize
    if (lastSize.current.w === viewportWidth && lastSize.current.h === viewportHeight) return;
    lastSize.current = { w: viewportWidth, h: viewportHeight };

    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    // Update ALL matrices in the scene (including parent groups)
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(object);
    const modelWidth = box.max.x - box.min.x;
    if (modelWidth === 0) return;

    const modelTopY = box.max.y;
    const modelCenterX = (box.min.x + box.max.x) / 2;

    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const aspect = viewportWidth / viewportHeight;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

    // Small margin so the model doesn't clip at screen edges
    const distance = (modelWidth / 2) / Math.tan(hFov / 2) * 1.02;
    const visibleHeight = 2 * Math.tan(vFov / 2) * distance;

    const targetY = modelTopY - visibleHeight / 2;

    camera.position.set(modelCenterX, targetY, distance);
    camera.lookAt(modelCenterX, targetY, 0);
    camera.updateProjectionMatrix();
  });

  return <primitive object={object} />;
}

// function FitModelWidth({
//   object,
//   camera,
//   viewportWidth,
//   viewportHeight,
// }: {
//   object: THREE.Object3D;
//   camera: THREE.Camera;
//   viewportWidth: number;
//   viewportHeight: number;
// })
// {
//   useLayoutEffect(() =>
//   {
//     if (!(camera instanceof THREE.PerspectiveCamera))
//     {
//       return
//     }

//     const frame = window.requestAnimationFrame(() =>
//     {
//       const bounds = new THREE.Box3().setFromObject(object)
//       const modelWidth = bounds.max.x - bounds.min.x
//       if (modelWidth === 0)
//       {
//         return
//       }

//       object.updateWorldMatrix(true, true);
//       // const top = bounds.max.y
//       // const distance = camera.position.distanceTo(top)
//       // const horizontalFov =
//       //   2 * Math.atan(
//       //     Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) *
//       //     (viewportWidth / viewportHeight)
//       //   )
//       // const visibleWidth = 2 * Math.tan(horizontalFov / 2) * distance
//       // camera.zoom = (visibleWidth / modelWidth) * 0.92
//       // camera.updateProjectionMatrix()
//       // camera.lookAt(center)
//       const modelTopY = bounds.max.y
//       const modelCenterX = (bounds.min.x + bounds.max.x) / 2

//       // Horizontal FOV (derived from vertical FOV + aspect)
//       const vFov = THREE.MathUtils.degToRad(camera.fov)
//       const aspect = viewportWidth / viewportHeight
//       const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)

//       // Distance so model width fills screen width
//       const distance = (modelWidth / 2) / Math.tan(hFov / 2)

//       // Visible height at that distance
//       const visibleHeight = 2 * Math.tan(vFov / 2) * distance

//       // Target Y so model top = screen top
//       const targetY = modelTopY - visibleHeight / 3;

//       // Camera at targetY (level, no tilt)
//       camera.position.set(modelCenterX, targetY, distance);
//       // Look at target (prevents default "pointing down")
//       camera.lookAt(modelCenterX, targetY, 0);
//       camera.updateProjectionMatrix();
//     })

//     return () => window.cancelAnimationFrame(frame)
//   }, [camera, object, viewportHeight, viewportWidth])

//   return <primitive object={object} />
// }

function PortfolioAmp(props: GroupProps)
{
  const { scene } = useGLTF('/3d/portfolio-amp2.glb')
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  return (
    <group {...props}>
      <FitModelWidth
        object={scene}
        camera={camera}
        viewportWidth={size.width}
        viewportHeight={size.height}
      />
    </group>
  )
}

function PortfolioPrinter(props: GroupProps)
{
  const { scene } = useGLTF('/3d/portfolio-printer2.glb')
  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  )
}
function PortfolioComputer(props: GroupProps)
{
  const { scene } = useGLTF('/3d/portfolio-computer.glb')
  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  )
}



function ScrollListener({
  children,
  scrollProgress,
}: {
  children: React.ReactNode;
  scrollProgress: React.MutableRefObject<number>;
})
{
  const scrollProgressRef = useRef(scrollProgress);

  useEffect(() =>
  {
    const updateScrollProgress = () =>
    {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      scrollProgressRef.current.current =
        scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    };

    // Set the initial value and keep it updated while the user scrolls.
    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });

    // Remove the listener when this component is unmounted.
    return () =>
    {
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
})
{
  // Refs let us update Three.js values without causing React re-renders.
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) =>
  {
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

export default function BackgroundAnimation()
{
  // const scrollProgress = useRef(0);
  return (
    // <ScrollListener scrollProgress={scrollProgress}> 
    <BackgroundWrapper>
      <Canvas camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 100000 }}>
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
