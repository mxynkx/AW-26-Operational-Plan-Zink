import type { ReactNode } from "react";
import { TopNav } from "./TopNav";

interface AppShellProps {
  children: ReactNode;
  storeBadge?: number;
}

export function AppShell({ children, storeBadge }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopNav storeBadge={storeBadge} />
      {children}
    </div>
  );
}
