import { CatalogPanel } from "../panels/CatalogPanel";
import { CommercialPanel } from "../panels/CommercialPanel";
import { ExportPanel } from "../panels/ExportPanel";
import { PropertiesPanel } from "../panels/PropertiesPanel";
import { SettingsPanel } from "../panels/SettingsPanel";
import { ChatSidebar } from "../chat/ChatSidebar";
import { Viewport } from "../viewport/Viewport";
import { useProjectStore } from "../state/projectStore";

export function AppShell() {
  const placeSelected = useProjectStore((s) => s.placeSelected);
  const refresh = useProjectStore((s) => s.refresh);
  const scene = useProjectStore((s) => s.scene);

  return (
    <div className="app-shell">
      <header className="topbar">
        <strong>3d-movel-illustrator</strong>
        <button
          type="button"
          onClick={async () => {
            const dir = await window.movel?.dialog.openDirectory();
            if (dir) await window.movel.project.save(dir);
            await refresh();
          }}
        >
          Save
        </button>
        <button
          type="button"
          onClick={async () => {
            const dir = await window.movel?.dialog.openDirectory();
            if (dir) await window.movel.project.load(dir);
            await refresh();
          }}
        >
          Open
        </button>
        <button type="button" onClick={() => void placeSelected()}>
          Place selected
        </button>
        <span style={{ marginLeft: "auto", opacity: 0.7 }}>
          Room {scene.room.widthMm}×{scene.room.depthMm}×{scene.room.heightMm} mm ·{" "}
          {scene.instances.length} modules
        </span>
      </header>
      <aside className="sidebar">
        <CatalogPanel />
        <PropertiesPanel />
        <CommercialPanel />
        <ExportPanel />
        <SettingsPanel />
      </aside>
      <main className="viewport">
        <Viewport />
      </main>
      <aside className="chat">
        <ChatSidebar />
      </aside>
    </div>
  );
}
