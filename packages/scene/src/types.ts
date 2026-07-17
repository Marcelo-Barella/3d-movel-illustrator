export type Vec3 = { x: number; y: number; z: number };

export type Room = {
  widthMm: number;
  depthMm: number;
  heightMm: number;
};

export type ModuleInstance = {
  id: string;
  moduleId: string;
  position: Vec3;
  rotationYDeg: number;
  paramOverrides: Record<string, number | string | boolean>;
  materialOverrides: Record<string, string>;
};

export type SceneState = {
  room: Room;
  instances: ModuleInstance[];
  selection: string[];
};
