"use client";
import React, { useEffect, useRef } from "react";

export default function ScrollListener({
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
  return <div style={{ width: "100%", height: "100%" }}>{children}</div>;
}
