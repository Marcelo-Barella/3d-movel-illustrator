import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import { useProjectStore } from "../state/projectStore";

function RoomBox({
  widthMm,
  depthMm,
  heightMm,
}: {
  widthMm: number;
  depthMm: number;
  heightMm: number;
}) {
  const w = widthMm / 1000;
  const d = depthMm / 1000;
  const h = heightMm / 1000;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[w / 2, 0, d / 2]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#2a3340" />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#334155" side={2} />
      </mesh>
      <mesh position={[w / 2, h / 2, d]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#334155" side={2} />
      </mesh>
      <mesh position={[0, h / 2, d / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} />
        <meshStandardMaterial color="#3b4556" side={2} />
      </mesh>
      <mesh position={[w, h / 2, d / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} />
        <meshStandardMaterial color="#3b4556" side={2} />
      </mesh>
    </group>
  );
}

function ModuleMesh({
  position,
  size,
  selected,
  onSelect,
}: {
  position: [number, number, number];
  size: [number, number, number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <mesh
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={selected ? "#60a5fa" : "#94a3b8"} />
    </mesh>
  );
}

export function Viewport() {
  const scene = useProjectStore((s) => s.scene);
  const pack = useProjectStore((s) => s.pack);
  const pushCommand = useProjectStore((s) => s.pushCommand);

  const modules = useMemo(() => {
    return scene.instances.map((inst) => {
      const mod = pack?.modules.find((m) => m.id === inst.moduleId);
      const width =
        Number(inst.paramOverrides.widthMm ?? mod?.params.find((p) => p.key === "widthMm")?.default ?? 600) /
        1000;
      const height =
        Number(
          inst.paramOverrides.heightMm ??
            mod?.params.find((p) => p.key === "heightMm")?.default ??
            720,
        ) / 1000;
      const depth =
        Number(
          inst.paramOverrides.depthMm ??
            mod?.params.find((p) => p.key === "depthMm")?.default ??
            560,
        ) / 1000;
      return {
        id: inst.id,
        position: [
          inst.position.x / 1000 + width / 2,
          height / 2,
          inst.position.z / 1000 + depth / 2,
        ] as [number, number, number],
        size: [width, height, depth] as [number, number, number],
        selected: scene.selection.includes(inst.id),
      };
    });
  }, [scene, pack]);

  return (
    <Canvas camera={{ position: [4, 3, 5], fov: 50 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 3]} intensity={0.9} />
      <RoomBox
        widthMm={scene.room.widthMm}
        depthMm={scene.room.depthMm}
        heightMm={scene.room.heightMm}
      />
      {modules.map((m) => (
        <ModuleMesh
          key={m.id}
          position={m.position}
          size={m.size}
          selected={m.selected}
          onSelect={() => {
            void pushCommand({ type: "set_selection", selection: [m.id] });
          }}
        />
      ))}
      <OrbitControls makeDefault />
    </Canvas>
  );
}
