import "server-only";
import { getAdminStatus } from "@/app/actions/auth-admin";

export class AdminRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireAdminRequest(request: Request) {
  const status = await getAdminStatus();
  if (!status.isSignedIn) throw new AdminRequestError(401, "Sign in required.");
  if (!status.isAdmin)
    throw new AdminRequestError(403, "Administrator access required.");
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new AdminRequestError(
      403,
      "Submit changes from this site's admin dashboard.",
    );
  }
}

export async function readAdminJson(request: Request): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new AdminRequestError(415, "JSON request required.");
  if (Number(request.headers.get("content-length")) > 16_384)
    throw new AdminRequestError(413, "Request too large.");
  if (!request.body) throw new AdminRequestError(400, "Request body required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_384) {
        await reader.cancel();
        throw new AdminRequestError(413, "Request too large.");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof AdminRequestError) throw error;
    throw new AdminRequestError(400, "Invalid JSON request.");
  } finally {
    reader.releaseLock();
  }
}

export function adminErrorResponse(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof AdminRequestError
          ? error.message
          : "The catalog update could not be completed.",
    },
    {
      status: error instanceof AdminRequestError ? error.status : 502,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
