"use client";
import React from "react";
import { Html } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

type Vec3 = [number, number, number];
type HtmlProps = React.ComponentProps<typeof Html>;
type MeshProps = ThreeElements["mesh"];

export type HtmlPlaneProps = Omit<
  HtmlProps,
  | "children"
  | "transform"
  | "distanceFactor"
  | "style"
  | "position"
  | "rotation"
  | "scale"
> & {
  position?: Vec3;
  rotation?: Vec3;
  /** Plane width in world units. Overrides `size[0]`. */
  width?: number;
  /** Plane height in world units. Overrides `size[1]`. */
  height?: number;
  /** Convenience shorthand for width/height. */
  size?: number | [number, number];
  /** CSS pixels per world unit. Used to derive `distanceFactor`. */
  pixelsPerUnit?: number;
  /** Which edge stays at `position` when width changes. @default "left" */
  anchor?: "left" | "center" | "right";
  /** Which edge stays at `position` when height changes. @default "top" */
  verticalAnchor?: "top" | "center" | "bottom";
  /** Explicit drei distanceFactor; overrides `pixelsPerUnit`. */
  distanceFactor?: number;
  /** Render the backing plane. Disable if you only want the HTML. */
  renderPlane?: boolean;
  /** Props for the backing plane mesh. */
  planeProps?: Omit<MeshProps, "children">;
  /** Custom material for the backing plane. */
  planeMaterial?: React.ReactNode;
  /** Force every DOM layer to stay transparent. @default true */
  forceTransparent?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Generic R3F component that renders regular HTML/CSS on a plane. The DOM
 * element shares the plane's transform, so its viewport matches the plane
 * exactly, including perspective, rotation and scale.
 *
 * Any prop not listed below is forwarded to drei's `<Html>` (occlude,
 * sprite, portal, zIndexRange, pointerEvents, etc.).
 */
export default function HtmlPlane({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width,
  height,
  size = 1,
  pixelsPerUnit = 200,
  anchor = "left",
  verticalAnchor = "top",
  distanceFactor,
  renderPlane = true,
  planeProps,
  planeMaterial,
  forceTransparent = true,
  style,
  children,
  ...htmlProps
}: HtmlPlaneProps)
{
  const planeWidth = width ?? (Array.isArray(size) ? size[0] : size);
  const planeHeight = height ?? (Array.isArray(size) ? size[1] : size);

  // drei centers transformed HTML on its group origin. Offsetting the group by
  // half the width makes the chosen edge stay at `position`, so growing the
  // width extends to the right instead of expanding both ways.
  const anchorOffsetX =
    anchor === "left"
      ? planeWidth / 2
      : anchor === "right"
        ? -planeWidth / 2
        : 0;
  // CSS Y points down while Three Y points up, so these are inverted
  // relative to the horizontal anchor.
  const anchorOffsetY =
    verticalAnchor === "bottom"
      ? planeHeight / 2
      : verticalAnchor === "top"
        ? -planeHeight / 2
        : 0;

  // drei maps DOM pixels to world units with: px * distanceFactor / 400.
  // This makes the HTML exactly planeWidth x planeHeight world units.
  const factor = distanceFactor ?? 400 / pixelsPerUnit;

  return (
    <group position={position} rotation={rotation}>
      {renderPlane && (
        <mesh {...planeProps} position={[anchorOffsetX, anchorOffsetY, 0]}>
          <planeGeometry args={[planeWidth, planeHeight]} />
          {planeMaterial ?? (
            <meshBasicMaterial
              transparent
              opacity={0}
              depthWrite={false}
              visible={false}
            />
          )}
        </mesh>
      )}
      <Html
        transform
        wrapperClass={forceTransparent ? "htmlplane-root" : undefined}
        position={[anchorOffsetX, anchorOffsetY, 0]}
        distanceFactor={factor}
        style={{
          ...(forceTransparent && {
            background: "transparent",
            backgroundColor: "transparent",
            backgroundImage: "none",
          }),
          width: planeWidth * pixelsPerUnit,
          height: planeHeight * pixelsPerUnit,
          ...style,
        }}
        {...htmlProps}
      >
        {forceTransparent && (
          <style>{`.htmlplane-root { background: transparent !important; background-image: none !important; }`}</style>
        )}
        {children}
      </Html>
    </group>
  );
}
