// @ts-nocheck
import qrcode from 'https://esm.sh/qrcode-generator@2.0.4'
import { sendEmail } from './email.ts'
import { PASS_LOGO_PNG_BASE64 } from './pass-logo.ts'

// Keep in sync with QR_PREFIX in features/registration/qr.ts: the scanner reads this exact text.
const QR_PREFIX = 'NEOTEAM-SR26:'
const SITE_URL = (Deno.env.get('SITE_URL')?.trim() ?? '').replace(/\/$/, '')

// Keep in sync with eventConfig, agenda[0] and passFacts in features/event/.
const EVENT = {
  date: 'Domingo 18 de octubre de 2026',
  time: 'Llegada a las 7:30 a. m.',
  route: 'Ruta 5K · Parque del Ingenio y sus alrededores',
  place: 'Parque del Ingenio, Cali',
  facts: [
    ['Fecha', '18 OCT · 2026'],
    ['Llegada', '7:30 a. m.'],
    ['Lugar', 'Parque del Ingenio, Cali'],
  ],
}
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVENT.place)}`

export type PassRecipient = {
  email: string
  first_name: string
  last_name?: string
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

// The race bib from the site, as tables with inline styles so Gmail and Outlook render it.
export function sendPassEmail(row: PassRecipient, options: { idempotencyKey?: string } = {}) {
  const name = escapeHtml(row.first_name.trim() || 'corredor')
  const fullName = escapeHtml(`${row.first_name} ${row.last_name ?? ''}`.trim() || 'corredor')
  const code = escapeHtml(row.registration_code)
  const passUrl = `${SITE_URL}/pase`
  const facts = EVENT.facts
    .map(
      ([label, value]) =>
        `<td valign="top" width="33%" style="padding:0 6px"><div style="font-size:12px;font-weight:bold;letter-spacing:.12em;color:#03f8f6">${label.toUpperCase()}</div><div style="margin-top:4px;font-size:14px;line-height:1.4;color:#c2cdcd">${value}</div></td>`,
    )
    .join('')
  return sendEmail(
    {
      to: row.email,
      subject: 'Tu pase para el NeoTeam Social Run',
      text: [
        `Hola, ${row.first_name.trim()}. Tu inscripción está confirmada.`,
        `Código: ${row.registration_code}`,
        `${EVENT.date} · ${EVENT.time}`,
        `Lugar: ${EVENT.place}`,
        EVENT.route,
        'Muestra el QR de este correo en el check-in.',
        `Tu pase: ${passUrl}`,
        `Cómo llegar: ${MAPS_URL}`,
      ].join('\n\n'),
      html: `<!doctype html><html lang="es"><body style="margin:0;padding:24px 12px;background:#f2f8f8;font-family:Arial,Helvetica,sans-serif;color:#050505">
  <p style="max-width:420px;margin:0 auto 16px;font-size:16px;line-height:1.5">Hola, ${name}. Ya estás dentro: muestra este QR en el check-in el día del evento.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;margin:0 auto;background:#050505;border-radius:16px;color:#ffffff">
  <tr><td align="center" style="padding:32px 20px 0"><img src="cid:pass-logo" width="180" height="57" alt="NeoTeam" style="display:block;width:180px;height:57px;border:0"></td></tr>
  <tr><td align="center" style="padding:14px 20px 0;font-size:12px;font-weight:bold;letter-spacing:.14em;color:#03f8f6">ANIVERSARIO NEOTEAM · SOCIAL RUN</td></tr>
  <tr><td align="center" style="padding:16px 12px 0;font-size:40px;line-height:1;font-weight:bold;letter-spacing:-1px;white-space:nowrap">${code}</td></tr>
  <tr><td align="center" style="padding:8px 20px 0;font-size:18px;font-weight:bold;color:#c2cdcd">${fullName}</td></tr>
  <tr><td align="center" style="padding:20px 20px 24px"><table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px"><tr><td style="padding:12px"><img src="cid:pass-qr" width="280" height="280" alt="QR de tu pase ${code}" style="display:block;width:280px;height:280px;border:0"></td></tr></table></td></tr>
  <tr><td style="padding:0 20px"><div style="border-top:2px dashed #27302f;font-size:0;line-height:0">&nbsp;</div></td></tr>
  <tr><td style="padding:16px 14px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${facts}</tr></table></td></tr>
  </table>
  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:420px;margin:20px auto 0"><tr>
  <td style="padding:0 6px 0 0"><a href="${passUrl}" style="display:inline-block;background:#050505;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:14px 20px;border-radius:8px">Ver mi pase</a></td>
  <td><a href="${MAPS_URL}" style="display:inline-block;border:1px solid #737d7c;color:#050505;text-decoration:none;font-weight:bold;font-size:14px;padding:13px 20px;border-radius:8px">Cómo llegar</a></td>
  </tr></table>
  <p style="max-width:420px;margin:24px auto 0;font-size:12px;line-height:1.5;color:#5c6565">Este QR es personal. Si no te inscribiste, ignora este correo.</p>
  </body></html>`,
      attachments: [
        { filename: 'pase-qr.gif', content: qrGifBase64(row.checkin_token), content_id: 'pass-qr' },
        { filename: 'neoteam.png', content: PASS_LOGO_PNG_BASE64, content_id: 'pass-logo' },
      ],
    },
    options,
  )
}
