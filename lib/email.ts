import "server-only";
import type { StoredRsvp } from "./rsvp-store";

export async function notifyCouple(rsvp: StoredRsvp): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const to = (process.env.RSVP_NOTIFY_TO ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (to.length === 0) return;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const yes = rsvp.attending === "yes";
  const from = process.env.RSVP_NOTIFY_FROM ?? "RSVP <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to,
    subject: yes
      ? `🤍 ${rsvp.name} confirmou presença`
      : `😔 ${rsvp.name} não poderá ir`,
    html: renderHtml(rsvp),
  });
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function row(label: string, value: string) {
  if (!value) return "";
  return `<tr><td style="padding:6px 16px 6px 0;color:#8a7a5c;font:600 11px system-ui;text-transform:uppercase;letter-spacing:1px;vertical-align:top">${label}</td><td style="padding:6px 0;color:#262220;font:400 14px system-ui">${esc(value)}</td></tr>`;
}

function renderHtml(r: StoredRsvp) {
  const yes = r.attending === "yes";
  return `
  <div style="max-width:560px;margin:0 auto;padding:32px;background:#faf7f2;font-family:system-ui">
    <p style="margin:0 0 8px;color:#b08d57;font:600 11px system-ui;text-transform:uppercase;letter-spacing:3px">
      Nova resposta de RSVP
    </p>
    <h1 style="margin:0 0 24px;font:300 28px Georgia,serif;color:#262220">
      ${yes ? "Presença confirmada" : "Não poderá comparecer"}
    </h1>
    <table style="width:100%;border-collapse:collapse">
      ${row("Nome", r.name)}
      ${row("E-mail", r.email)}
      ${row("Telefone", r.phone)}
      ${yes ? row("Acompanhantes", String(r.guests)) : ""}
      ${yes ? row("Nomes", r.guestNames) : ""}
      ${yes ? row("Restrições", r.diet) : ""}
      ${row("Recado", r.message)}
    </table>
    <p style="margin:32px 0 0;color:#8a7a5c;font:400 11px system-ui">
      Recebido em ${new Date(r.createdAt).toLocaleString("pt-BR")}
    </p>
  </div>`;
}