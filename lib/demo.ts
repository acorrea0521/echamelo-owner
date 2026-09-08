import "server-only";

// Demo accounts are created by an admin with nothing but a username and a
// password. Supabase Auth still requires an email per user, so we mint a
// synthetic one on a domain that is never used for real mail — the account is
// created pre-confirmed, so nothing is ever sent to it, and the person signs
// in with their username through /api/auth/login like everyone else.
export const DEMO_EMAIL_DOMAIN = "demo.echamelo.mx";

// Same shape the rest of the app assumes for a username: lowercase, no spaces,
// safe to drop into an email local part without escaping.
export const DEMO_USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export const DEMO_MIN_PASSWORD_LENGTH = 8;

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

export function demoEmailFor(username: string) {
  return `${username}@${DEMO_EMAIL_DOMAIN}`;
}
