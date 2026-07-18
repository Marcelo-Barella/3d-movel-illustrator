import { err, ok, type Result } from "@movel/shared";

type Tok =
  | { kind: "num"; value: number }
  | { kind: "id"; value: string }
  | { kind: "op"; value: "+" | "-" | "*" | "/" | "(" | ")" };

export function evalFormula(
  formula: string,
  vars: Record<string, number>,
): Result<number> {
  const cleaned = formula.trim();
  if (cleaned.length === 0) {
    return err([
      {
        code: "FORMULA_EMPTY",
        severity: "error",
        message: "empty formula",
      },
    ]);
  }

  const tokens: Tok[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const ch = cleaned[i]!;
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (
      ch === "+" ||
      ch === "-" ||
      ch === "*" ||
      ch === "/" ||
      ch === "(" ||
      ch === ")"
    ) {
      tokens.push({ kind: "op", value: ch });
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i + 1;
      while (j < cleaned.length && /[0-9.]/.test(cleaned[j]!)) j += 1;
      const raw = cleaned.slice(i, j);
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        return err([
          {
            code: "FORMULA_BAD_NUMBER",
            severity: "error",
            message: `bad number ${raw}`,
          },
        ]);
      }
      tokens.push({ kind: "num", value });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < cleaned.length && /[A-Za-z0-9_]/.test(cleaned[j]!)) j += 1;
      tokens.push({ kind: "id", value: cleaned.slice(i, j) });
      i = j;
      continue;
    }
    return err([
      {
        code: "FORMULA_BAD_CHAR",
        severity: "error",
        message: `unexpected character ${ch}`,
      },
    ]);
  }

  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpr(): Result<number> {
    let left = parseTerm();
    if (!left.ok) return left;
    while (
      peek()?.kind === "op" &&
      (peek()!.value === "+" || peek()!.value === "-")
    ) {
      const op = next()!.value as "+" | "-";
      const right = parseTerm();
      if (!right.ok) return right;
      left = ok(op === "+" ? left.value + right.value : left.value - right.value);
    }
    return left;
  }

  function parseTerm(): Result<number> {
    let left = parseUnary();
    if (!left.ok) return left;
    while (
      peek()?.kind === "op" &&
      (peek()!.value === "*" || peek()!.value === "/")
    ) {
      const op = next()!.value as "*" | "/";
      const right = parseUnary();
      if (!right.ok) return right;
      if (op === "/" && right.value === 0) {
        return err([
          {
            code: "FORMULA_DIV_ZERO",
            severity: "error",
            message: "division by zero",
          },
        ]);
      }
      left = ok(
        op === "*" ? left.value * right.value : left.value / right.value,
      );
    }
    return left;
  }

  function parseUnary(): Result<number> {
    if (peek()?.kind === "op" && peek()!.value === "-") {
      next();
      const inner = parseUnary();
      if (!inner.ok) return inner;
      return ok(-inner.value);
    }
    return parsePrimary();
  }

  function parsePrimary(): Result<number> {
    const t = peek();
    if (!t) {
      return err([
        {
          code: "FORMULA_UNEXPECTED_EOF",
          severity: "error",
          message: "unexpected end of formula",
        },
      ]);
    }
    if (t.kind === "num") {
      next();
      return ok(t.value);
    }
    if (t.kind === "id") {
      next();
      if (!(t.value in vars)) {
        return err([
          {
            code: "FORMULA_UNKNOWN_ID",
            severity: "error",
            message: `unknown identifier ${t.value}`,
          },
        ]);
      }
      return ok(vars[t.value]!);
    }
    if (t.kind === "op" && t.value === "(") {
      next();
      const inner = parseExpr();
      if (!inner.ok) return inner;
      const close = next();
      if (!close || close.kind !== "op" || close.value !== ")") {
        return err([
          {
            code: "FORMULA_UNCLOSED",
            severity: "error",
            message: "expected )",
          },
        ]);
      }
      return inner;
    }
    return err([
      {
        code: "FORMULA_UNEXPECTED_TOKEN",
        severity: "error",
        message: "unexpected token",
      },
    ]);
  }

  const value = parseExpr();
  if (!value.ok) return value;
  if (pos !== tokens.length) {
    return err([
      {
        code: "FORMULA_TRAILING",
        severity: "error",
        message: "trailing tokens in formula",
      },
    ]);
  }
  return value;
}
