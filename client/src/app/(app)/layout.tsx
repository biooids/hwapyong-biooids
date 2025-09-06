//src/app/(app)/layout.tsx
import React, { ReactNode } from "react";

export default function layout({
  children,
  header,
  footer,
  sidebar,
}: {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <div>
      <header>{header}</header>
      <main></main>
      <footer></footer>
    </div>
  );
}
