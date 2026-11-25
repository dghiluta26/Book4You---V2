/**
 * Where to go after logging in (?next=/some/page). Only paths inside this site are accepted,
 * so a crafted link cannot send a user to another website (open redirect).
 */
export function safeRedirectPath(next: string | null, fallback = "/profile"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback
  return next
}
