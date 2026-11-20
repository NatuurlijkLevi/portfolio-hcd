import React from "react";

export default function BackgroundWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="fixed inset-0 z-[-1]">{children}</div>;
}
