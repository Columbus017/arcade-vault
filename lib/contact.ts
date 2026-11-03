export const CONTACT_LIMITS = { name: 80, email: 254, msg: 2000 } as const;

export interface ContactInput {
  name: string;
  email: string;
  msg: string;
}

export type ContactField = keyof ContactInput;

export type ContactResult =
  | { status: "idle" }
  | { status: "success"; name: string }
  | { status: "error" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Trims all fields; returns null if valid, or the first invalid field.
export function validateContact(input: ContactInput): ContactField | null {
  const name = input.name.trim();
  const email = input.email.trim();
  const msg = input.msg.trim();

  if (!name || name.length > CONTACT_LIMITS.name) return "name";
  if (!email || email.length > CONTACT_LIMITS.email || !EMAIL_RE.test(email)) {
    return "email";
  }
  if (!msg || msg.length > CONTACT_LIMITS.msg) return "msg";
  return null;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
