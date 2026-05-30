"use client";

import { usePropertiesProvider } from "@/hooks/useProperties";

export function Providers({ children }: { children: React.ReactNode }) {
  usePropertiesProvider();
  return <>{children}</>;
}
