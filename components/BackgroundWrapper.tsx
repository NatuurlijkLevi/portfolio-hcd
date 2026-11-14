import React from "react";

export default function BackgroundWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full w-full fixed z-[-1]">{children}</div>;
}
