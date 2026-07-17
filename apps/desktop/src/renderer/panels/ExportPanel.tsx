import { useState } from "react";

export function ExportPanel() {
  const [status, setStatus] = useState("");
  return (
    <div className="panel">
      <section>
        <h3>Export</h3>
        <button
          type="button"
          onClick={async () => {
            const result = await window.movel?.export.production({
              adapters: ["scm", "homag", "biesse", "generic"],
            });
            setStatus(JSON.stringify(result));
          }}
        >
          Export production bundle
        </button>
        <pre style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{status}</pre>
      </section>
    </div>
  );
}
