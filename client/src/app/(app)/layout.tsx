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
    <div className=" ">
      <header className="w-full sticky top-0 z-50 backdrop-blur-lg">
        {header}
      </header>
      <div className="flex">
        <aside>{sidebar}</aside>
        <main className="min-h-screen  flex-1    ">{children}</main>
      </div>
      <footer>{footer}</footer>
    </div>
  );
}
