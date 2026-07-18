import { useState } from "react";
import { useProjectStore } from "../state/projectStore";

export function CatalogPanel() {
  const pack = useProjectStore((s) => s.pack);
  const selectedModuleId = useProjectStore((s) => s.selectedModuleId);
  const setSelected = (id: string) =>
    useProjectStore.setState({ selectedModuleId: id });
  const [authorOpen, setAuthorOpen] = useState(false);
  const [draftName, setDraftName] = useState("Custom Module");
  const [importReport, setImportReport] = useState<string>("");

  return (
    <div className="panel">
      <section>
        <h3>Catalog</h3>
        {(pack?.modules ?? []).map((m) => (
          <div
            key={m.id}
            className="list-item"
            style={{
              outline:
                selectedModuleId === m.id ? "1px solid #60a5fa" : undefined,
            }}
            onClick={() => setSelected(m.id)}
          >
            <div>{m.name}</div>
            <small>
              {m.id} · {m.category}
            </small>
          </div>
        ))}
        <div className="row">
          <button type="button" onClick={() => setAuthorOpen((v) => !v)}>
            Author module
          </button>
          <button
            type="button"
            onClick={async () => {
              const path = await window.movel?.dialog.openFile();
              if (!path || !window.movel) return;
              const read = await window.movel.file.readText(path);
              if (!read.ok) {
                setImportReport(JSON.stringify(read.diagnostics ?? read, null, 2));
                return;
              }
              const res = await window.movel.catalog.importCsv(read.value);
              setImportReport(JSON.stringify(res.diagnostics ?? [], null, 2));
              await useProjectStore.getState().refresh();
            }}
          >
            Import CSV
          </button>
        </div>
        {authorOpen ? (
          <div style={{ marginTop: 8 }}>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
            <p style={{ fontSize: 12, opacity: 0.75 }}>
              Draft authoring uses catalog APIs in-process via sample pack
              editing in a later save. Use Import CSV for pack replacement.
            </p>
          </div>
        ) : null}
        {importReport ? (
          <pre style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{importReport}</pre>
        ) : null}
      </section>
    </div>
  );
}
