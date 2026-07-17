import type { Diagnostic } from "./diagnostics.js";

export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; diagnostics: Diagnostic[] };
export type Result<T> = Ok<T> | Err;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err(diagnostics: Diagnostic[]): Err {
  return { ok: false, diagnostics };
}

export function isOk<T>(result: Result<T>): result is Ok<T> {
  return result.ok;
}
