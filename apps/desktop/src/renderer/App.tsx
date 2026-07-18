import { useEffect } from "react";
import { AppShell } from "./layout/AppShell";
import { useProjectStore } from "./state/projectStore";

export function App() {
  const bootstrap = useProjectStore((s) => s.bootstrap);
  const ready = useProjectStore((s) => s.ready);
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);
  if (!ready) return <div style={{ padding: 24 }}>Loading…</div>;
  return <AppShell />;
}
