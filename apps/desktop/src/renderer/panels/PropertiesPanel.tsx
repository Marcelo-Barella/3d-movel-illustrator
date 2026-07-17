import { useProjectStore } from "../state/projectStore";

export function PropertiesPanel() {
  const scene = useProjectStore((s) => s.scene);
  const pushCommand = useProjectStore((s) => s.pushCommand);
  const selected = scene.instances.find((i) =>
    scene.selection.includes(i.id),
  );

  return (
    <div className="panel">
      <section>
        <h3>Properties</h3>
        <div className="row">
          <label>
            W
            <input
              type="number"
              defaultValue={scene.room.widthMm}
              onBlur={(e) => {
                void pushCommand({
                  type: "set_room",
                  room: {
                    ...scene.room,
                    widthMm: Number(e.target.value),
                  },
                });
              }}
            />
          </label>
          <label>
            D
            <input
              type="number"
              defaultValue={scene.room.depthMm}
              onBlur={(e) => {
                void pushCommand({
                  type: "set_room",
                  room: {
                    ...scene.room,
                    depthMm: Number(e.target.value),
                  },
                });
              }}
            />
          </label>
          <label>
            H
            <input
              type="number"
              defaultValue={scene.room.heightMm}
              onBlur={(e) => {
                void pushCommand({
                  type: "set_room",
                  room: {
                    ...scene.room,
                    heightMm: Number(e.target.value),
                  },
                });
              }}
            />
          </label>
        </div>
        {selected ? (
          <div>
            <div>{selected.moduleId}</div>
            <small>{selected.id}</small>
            <label>
              widthMm
              <input
                type="number"
                defaultValue={Number(selected.paramOverrides.widthMm ?? 600)}
                onBlur={(e) => {
                  void pushCommand({
                    type: "set_params",
                    id: selected.id,
                    paramOverrides: { widthMm: Number(e.target.value) },
                  });
                }}
              />
            </label>
          </div>
        ) : (
          <p style={{ opacity: 0.6 }}>Select a module</p>
        )}
      </section>
    </div>
  );
}
