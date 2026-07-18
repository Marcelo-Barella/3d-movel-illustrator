export type { Room } from "./types.js";

export function roomVolumeM3(room: {
  widthMm: number;
  depthMm: number;
  heightMm: number;
}): number {
  return (room.widthMm * room.depthMm * room.heightMm) / 1_000_000_000;
}
