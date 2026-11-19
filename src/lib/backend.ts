// Where the standalone backend lives, for the /api proxy routes.
// NEXT_PUBLIC_API_BASE_URL is the current name. BACKEND_URL is the name the
// routes read before and the one env-example.local documents, so a deployment
// configured with either one works.
const configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL;

export const BACKEND_URL = (configuredUrl || "http://localhost:3001").replace(/\/+$/, "");

// Turns a failed request to the backend into a message that says what to fix.
// Node reports every connection failure as "fetch failed" and keeps the reason
// in `cause`.
export function describeBackendError(error: unknown): string {
  const err = error as Error & { cause?: { code?: string } };
  if (err.message !== "fetch failed") return err.message;

  const reason = err.cause?.code ? ` (${err.cause.code})` : "";
  if (!configuredUrl) {
    return `Backend URL is not configured, so the request went to ${BACKEND_URL} and failed${reason}. Set NEXT_PUBLIC_API_BASE_URL or BACKEND_URL to the backend's address and redeploy.`;
  }
  return `Could not reach the backend${reason}. Check that it is running and that NEXT_PUBLIC_API_BASE_URL or BACKEND_URL points to it.`;
}
