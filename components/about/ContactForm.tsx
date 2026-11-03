"use client";

import { useActionState, useEffect, useState } from "react";
import { sendContactMessage } from "@/app/about/actions";
import { validateContact, type ContactResult } from "@/lib/contact";

const EMPTY = { name: "", email: "", msg: "", website: "" };
const IDLE: ContactResult = { status: "idle" };

export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [state, formAction, pending] = useActionState(sendContactMessage, IDLE);
  const [shake, setShake] = useState(false);
  const [seen, setSeen] = useState(state);
  const [dismissed, setDismissed] = useState<ContactResult | null>(null);

  // Each action result is a new object: shake once per server error.
  if (state !== seen) {
    setSeen(state);
    if (state.status === "error") setShake(true);
  }

  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(false), 400);
    return () => clearTimeout(t);
  }, [shake]);

  const sent = state.status === "success" && state !== dismissed ? state.name : null;

  // Invalid input never reaches the server action.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (validateContact(form) !== null) {
      e.preventDefault();
      setShake(true);
    }
  };

  return (
    <section className="about-contact reveal">
      <div className="contact-grid">
        <div className="contact-intro">
          <div className="kicker pixel neon-cyan">▸ CONTACTO</div>
          <h2 className="contact-title">CONTÁCTANOS</h2>
          <p className="contact-sub">
            ¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente quieres saludar?
            Escríbenos.
          </p>
          <div className="contact-tips">
            <div className="tip">
              <span className="tip-led"></span>RESPUESTA EN 24-48H
            </div>
            <div className="tip">
              <span className="tip-led y"></span>SUGERENCIAS BIENVENIDAS
            </div>
            <div className="tip">
              <span className="tip-led m"></span>SIN SPAM, JAMÁS
            </div>
          </div>
        </div>

        <form
          className={"contact-form" + (shake ? " shake" : "")}
          action={formAction}
          onSubmit={onSubmit}
          noValidate
        >
          {!sent ? (
            <>
              <div className="field">
                <label htmlFor="contact-name">NOMBRE</label>
                <input
                  id="contact-name"
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="px_kai"
                />
              </div>
              <div className="field">
                <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jugador@vault.gg"
                />
              </div>
              <div className="field">
                <label htmlFor="contact-msg">MENSAJE</label>
                <textarea
                  id="contact-msg"
                  name="msg"
                  rows={5}
                  value={form.msg}
                  onChange={(e) => setForm({ ...form, msg: e.target.value })}
                  placeholder="Cuéntanos qué tienes en mente…"
                ></textarea>
              </div>
              <input
                name="website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
              />
              {state.status === "error" && (
                <p className="contact-error" role="alert">
                  ✖ ERROR DE TRANSMISIÓN. INTÉNTALO DE NUEVO.
                </p>
              )}
              <button
                className="btn xl press"
                type="submit"
                disabled={pending}
                style={{ width: "100%" }}
              >
                {pending ? "▶\u00a0\u00a0TRANSMITIENDO…" : "▶\u00a0\u00a0ENVIAR MENSAJE"}
              </button>
            </>
          ) : (
            <div className="terminal-success">
              <div className="term-bar">
                <span className="dot r"></span>
                <span className="dot y"></span>
                <span className="dot g"></span>
                <span className="term-title">VAULT-OS // TERMINAL</span>
              </div>
              <div className="term-body">
                <div className="line">
                  <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
                </div>
                <div className="line dim">[OK] Conectando con servidor…</div>
                <div className="line dim">[OK] Validando contenido…</div>
                <div className="line dim">[OK] Transmitiendo paquete…</div>
                <div className="line success">
                  &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {sent.toUpperCase()}.
                  <span className="caret">_</span>
                </div>
                <div style={{ marginTop: 18 }}>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => {
                      setDismissed(state);
                      setForm(EMPTY);
                    }}
                  >
                    ENVIAR OTRO MENSAJE
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
