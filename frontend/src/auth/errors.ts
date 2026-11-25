/** Turns Supabase Auth error codes into translation keys, so messages show in RO or EN. */
const KNOWN_ERRORS = {
  invalid_credentials: "auth.error.invalidCredentials",
  user_already_exists: "auth.error.userExists",
  email_exists: "auth.error.userExists",
  weak_password: "auth.error.weakPassword",
  email_not_confirmed: "auth.error.emailNotConfirmed",
  over_email_send_rate_limit: "auth.error.rateLimit",
  over_request_rate_limit: "auth.error.rateLimit",
  email_address_invalid: "auth.error.invalidEmail",
  email_address_not_authorized: "auth.error.emailNotAuthorized",
  validation_failed: "auth.error.invalidEmail",
} as const

export type AuthErrorKey =
  | (typeof KNOWN_ERRORS)[keyof typeof KNOWN_ERRORS]
  | "auth.error.generic"
  | "auth.error.notConfigured"

export function authErrorKey(error: { code?: string }): AuthErrorKey {
  return KNOWN_ERRORS[error.code as keyof typeof KNOWN_ERRORS] ?? "auth.error.generic"
}
