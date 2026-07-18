export function assertPositiveMm(n: number): number {
  if (!(typeof n === "number") || !Number.isFinite(n) || n <= 0) {
    throw new Error(`expected positive millimeters, got ${String(n)}`);
  }
  return n;
}
