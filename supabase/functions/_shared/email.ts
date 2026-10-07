// @ts-nocheck
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')?.trim() ?? ''
const EMAIL_FROM = Deno.env.get('EMAIL_FROM')?.trim() ?? ''

type Attachment = { filename: string; content: string; content_id?: string }
type Email = { to: string; subject: string; html: string; text: string; attachments?: Attachment[] }

// Resend's answer body never leaves this function; callers only see the status. Callers answer
// a failed delivery with 424, because the Next proxy replaces every 5xx with a generic message.
export async function sendEmail(email: Email): Promise<{ ok: boolean; status: number }> {
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    console.error('email not configured')
    return { ok: false, status: 503 }
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, ...email, to: [email.to] }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) console.error('email', response.status)
    return { ok: response.ok, status: response.status }
  } catch {
    console.error('email network')
    return { ok: false, status: 0 }
  }
}

const purposes = {
  admin: {
    subject: 'tu código para entrar al panel del Social Run',
    lead: 'Usa este código para entrar al panel del NeoTeam Social Run.',
  },
  pass: {
    subject: 'tu código para ver tu pase del Social Run',
    lead: 'Usa este código para ver tu pase del NeoTeam Social Run.',
  },
}

export function codeEmail(code: string, purpose: keyof typeof purposes) {
  const { subject, lead } = purposes[purpose]
  const note = 'Vence en 10 minutos y sirve una sola vez. Si no lo pediste, ignora este correo.'
  return {
    subject: `${code} es ${subject}`,
    text: `${lead}\n\n${code}\n\n${note}`,
    html: `<!doctype html><html lang="es"><body style="margin:0;padding:24px 12px;background:#f2f8f8;font-family:Arial,Helvetica,sans-serif;color:#050505">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#050505;color:#ffffff;padding:20px 24px;font-weight:bold;letter-spacing:.08em">NEOTEAM · SOCIAL RUN</td></tr>
<tr><td style="padding:28px 24px 8px;font-size:16px;line-height:1.5">${lead}</td></tr>
<tr><td style="padding:8px 24px"><div style="font-family:'Courier New',monospace;font-size:36px;font-weight:bold;letter-spacing:.3em;background:#defffd;color:#065958;border-radius:12px;padding:16px;text-align:center">${code}</div></td></tr>
<tr><td style="padding:16px 24px 28px;font-size:13px;line-height:1.5;color:#5c6565">${note}</td></tr>
</table></body></html>`,
  }
}
