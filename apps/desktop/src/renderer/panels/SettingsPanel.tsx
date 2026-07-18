import { useState } from "react";
import { useProjectStore } from "../state/projectStore";

export function SettingsPanel() {
  const providerId = useProjectStore((s) => s.providerId);
  const model = useProjectStore((s) => s.model);
  const setProvider = useProjectStore((s) => s.setProvider);
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <div className="panel">
      <section>
        <h3>Settings</h3>
        <label>
          Provider
          <select
            value={providerId}
            onChange={(e) => setProvider(e.target.value, model)}
          >
            <option value="mock">mock</option>
            <option value="openai">openai</option>
            <option value="anthropic">anthropic</option>
            <option value="deepseek">deepseek</option>
          </select>
        </label>
        <label>
          Model
          <input
            value={model}
            onChange={(e) => setProvider(providerId, e.target.value)}
          />
        </label>
        <label>
          API key (write-only)
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          onClick={async () => {
            if (!window.movel || !key) return;
            await window.movel.keys.set(providerId, key);
            setKey("");
            setMsg("Key stored in OS keychain (or memory fallback)");
          }}
        >
          Save key
        </button>
        <p style={{ fontSize: 12 }}>{msg}</p>
      </section>
    </div>
  );
}
