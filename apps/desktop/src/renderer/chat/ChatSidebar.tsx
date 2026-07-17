import { useState } from "react";
import { useProjectStore } from "../state/projectStore";

export function ChatSidebar() {
  const mode = useProjectStore((s) => s.mode);
  const setMode = useProjectStore((s) => s.setMode);
  const messages = useProjectStore((s) => s.messages);
  const sendChat = useProjectStore((s) => s.sendChat);
  const chatInFlight = useProjectStore((s) => s.chatInFlight);
  const confirm = useProjectStore((s) => s.confirm);
  const resolveConfirm = useProjectStore((s) => s.resolveConfirm);
  const [text, setText] = useState("");

  return (
    <>
      <h3>AI Chat</h3>
      <div className="row">
        {(["ask", "command", "build", "autonomous"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              background: mode === m ? "#2563eb" : undefined,
            }}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="messages">
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`} className={`msg ${m.role}`}>
            <strong>{m.role}</strong>
            <div>{m.content}</div>
          </div>
        ))}
      </div>
      <div className="composer">
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask or command the cabinetry agent"
        />
        <button
          type="button"
          disabled={chatInFlight}
          onClick={() => {
            const value = text.trim();
            if (!value || chatInFlight) return;
            setText("");
            void sendChat(value);
          }}
        >
          Send
        </button>
      </div>
      {confirm ? (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirm</h3>
            <p>{confirm.prompt}</p>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
              {JSON.stringify(confirm.payload, null, 2)}
            </pre>
            <div className="row">
              <button type="button" onClick={() => void resolveConfirm(true)}>
                Accept
              </button>
              <button type="button" onClick={() => void resolveConfirm(false)}>
                Deny
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
