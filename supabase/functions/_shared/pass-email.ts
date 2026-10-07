// @ts-nocheck
import qrcode from 'https://esm.sh/qrcode-generator@2.0.4'
import { sendEmail } from './email.ts'

// Keep in sync with QR_PREFIX in features/registration/qr.ts: the scanner reads this exact text.
const QR_PREFIX = 'NEOTEAM-SR26:'
const SITE_URL = (Deno.env.get('SITE_URL')?.trim() ?? '').replace(/\/$/, '')

// Keep in sync with eventConfig and the first agenda item in features/event/event.ts.
const EVENT = {
  date: 'Domingo 18 de octubre de 2026',
  time: 'Llegada a las 7:30 a. m.',
  route: 'Ruta 5K · Parque del Ingenio y sus alrededores',
}

export type PassRecipient = {
  email: string
  first_name: string
  registration_code: string
  checkin_token: string
}

// Email clients block SVG and data: images, so the QR travels as an inline GIF attachment.
function qrGifBase64(token: string) {
  const qr = qrcode(0, 'M')
  qr.addData(`${QR_PREFIX}${token}`)
  qr.make()
  return qr.createDataURL(8, 16).replace(/^data:image\/gif;base64,/, '')
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

export function sendPassEmail(row: PassRecipient) {
  const name = escapeHtml(row.first_name.trim() || 'corredor')
  const code = escapeHtml(row.registration_code)
  const passUrl = `${SITE_URL}/pase`
  return sendEmail({
    to: row.email,
    subject: 'Tu pase para el NeoTeam Social Run',
    text: [
      `Hola, ${row.first_name.trim()}. Tu inscripción está confirmada.`,
      `Código: ${row.registration_code}`,
      `${EVENT.date} · ${EVENT.time}`,
      EVENT.route,
      'Muestra el QR de este correo en el check-in.',
      `También lo encuentras en ${passUrl}`,
    ].join('\n\n'),
    html: `<!doctype html><html lang="es"><body style="margin:0;padding:24px 12px;background:#f2f8f8;font-family:Arial,Helvetica,sans-serif;color:#050505">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#050505;color:#ffffff;padding:20px 24px;font-weight:bold;letter-spacing:.08em">NEOTEAM · SOCIAL RUN</td></tr>
<tr><td style="padding:28px 24px 8px"><p style="margin:0 0 8px;font-size:22px;font-weight:bold">Hola, ${name}. Ya estás dentro.</p><p style="margin:0;font-size:16px;line-height:1.5;color:#5c6565">Muestra este QR en el check-in el día del evento.</p></td></tr>
<tr><td align="center" style="padding:16px 24px"><img src="cid:pass-qr" width="260" height="260" alt="QR de tu pase ${code}" style="display:block;width:260px;height:260px;border:0"></td></tr>
<tr><td align="center" style="padding:0 24px 20px;font-family:'Courier New',monospace;font-size:22px;font-weight:bold;letter-spacing:.12em;color:#065958">${code}</td></tr>
<tr><td style="padding:0 24px 24px;font-size:15px;line-height:1.6"><strong>${EVENT.date}</strong><br>${EVENT.time}<br>${EVENT.route}</td></tr>
<tr><td style="padding:0 24px 28px"><a href="${passUrl}" style="display:inline-block;background:#050505;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:12px">Ver mi pase</a></td></tr>
<tr><td style="padding:16px 24px;background:#e9f0f0;font-size:12px;line-height:1.5;color:#5c6565">Este QR es personal. Si no te inscribiste, ignora este correo.</td></tr>
</table></body></html>`,
    attachments: [
      { filename: 'pase-qr.gif', content: qrGifBase64(row.checkin_token), content_id: 'pass-qr' },
    ],
  })
}
