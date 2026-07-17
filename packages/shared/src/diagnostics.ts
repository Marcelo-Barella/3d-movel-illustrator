export type DiagnosticSeverity = "info" | "warning" | "error";

export type Diagnostic = {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  path?: string;
};
