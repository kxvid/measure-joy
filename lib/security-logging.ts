/** Retain operation/status diagnostics without provider payloads, customer data or credentials. */
export function logServerError(operation: string, error: unknown): void {
  const record = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const status = record.statusCode ?? record.status;
  console.error(operation, {
    status: typeof status === "number" && status >= 400 && status <= 599 ? status : undefined,
    kind: error instanceof Error ? "error" : "provider_failure",
  });
}
