"use server";

import { Resend } from "resend";
import {
  escapeHtml,
  validateContact,
  type ContactResult,
} from "@/lib/contact";

const field = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
};

export async function sendContactMessage(
  prev: ContactResult,
  formData: FormData,
): Promise<ContactResult> {
  const name = field(formData, "name").trim();
  const email = field(formData, "email").trim();
  const msg = field(formData, "msg").trim();

  // Honeypot: pretend success, send nothing.
  if (field(formData, "website") !== "") {
    return { status: "success", name };
  }

  const invalid = validateContact({ name, email, msg });
  if (invalid) {
    console.error(`contact: invalid field "${invalid}"`);
    return { status: "error" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
  if (!apiKey) {
    console.error("RESEND_API_KEY missing");
    return { status: "error" };
  }
  if (!to) {
    console.error("CONTACT_TO_EMAIL missing");
    return { status: "error" };
  }

  const subject = `[Arcade Vault] Nuevo mensaje de ${name.replace(/[\r\n]+/g, " ")}`;
  const text = `Nombre: ${name}\nCorreo: ${email}\n\n${msg}`;
  const html =
    `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p>` +
    `<p><strong>Correo:</strong> ${escapeHtml(email)}</p>` +
    `<p>${escapeHtml(msg).replace(/\r?\n/g, "<br>")}</p>`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject,
      text,
      html,
    });
    if (error) {
      console.error("Resend error:", error.message);
      return { status: "error" };
    }
  } catch (err) {
    console.error("Resend request failed:", err);
    return { status: "error" };
  }

  return { status: "success", name };
}
