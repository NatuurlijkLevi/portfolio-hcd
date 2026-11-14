"use client";
import React from "react";
import dynamic from "next/dynamic";

const BackgroundAnimation = dynamic(
  () => import("@/components/BackgroundAnimation"),
  { ssr: false },
);

export default function Home() {
  return <BackgroundAnimation />;
}
