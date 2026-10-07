import { readFile } from 'node:fs/promises'
import { ImageResponse } from 'next/og'
import { accentPaths, letterPaths } from '@/components/neoteam-logo'
import { passFacts } from '@/features/event/pass-facts'
import { passByToken } from '@/features/registration/pass'
import { passQrDataUrl } from '@/features/registration/qr'

export const runtime = 'nodejs'

// Satori cannot read CSS variables: these mirror the DESIGN.md tokens the on-screen bib uses.
const color = {
  black: '#050505',
  white: '#ffffff',
  accent: '#03f8f6',
  secondary: '#c2cdcd',
  border: '#27302f',
}

// Literal URLs so the bundler copies the font files into the function.
const fonts = () =>
  Promise.all([
    readFile(
      new URL('../../../features/registration/fonts/HostGrotesk-Medium.ttf', import.meta.url),
    ),
    readFile(
      new URL('../../../features/registration/fonts/HostGrotesk-ExtraBold.ttf', import.meta.url),
    ),
  ])

const notFound = () =>
  new Response('No encontramos este pase.', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })

const page = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: color.black,
  color: color.white,
  fontFamily: 'Host Grotesk',
  padding: '110px 72px 90px',
} as const

const eyebrow = {
  marginTop: 36,
  fontSize: 34,
  fontWeight: 800,
  letterSpacing: 6,
  color: color.accent,
}

const code = { marginTop: 40, fontSize: 150, fontWeight: 800, letterSpacing: -6, lineHeight: 1 }

const name = { marginTop: 18, fontSize: 52, fontWeight: 500, color: color.secondary }

const perforation = { marginTop: 64, width: '100%', borderTop: `4px dashed ${color.border}` }

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')?.trim().slice(0, 40) ?? ''
  const pass = token ? await passByToken(token) : null
  if (!pass) return notFound()

  const [medium, extraBold] = await fonts()

  return new ImageResponse(
    <div style={page}>
      <svg width="380" height="120" viewBox="0 0 1207 380" aria-hidden>
        {letterPaths.map((d) => (
          <path key={d} d={d} fill={color.white} />
        ))}
        {accentPaths.map((d) => (
          <path key={d} d={d} fill={color.accent} />
        ))}
      </svg>
      <div style={eyebrow}>ANIVERSARIO NEOTEAM · SOCIAL RUN</div>
      <div style={code}>{pass.code}</div>
      <div style={name}>{pass.name}</div>
      {/* biome-ignore lint/performance/noImgElement: Satori renders plain img elements only */}
      <img
        src={passQrDataUrl(pass.checkinToken)}
        width={860}
        height={860}
        alt=""
        style={{ marginTop: 56, borderRadius: 32, background: color.white }}
      />
      <div style={perforation} />
      <div
        style={{ marginTop: 48, width: '100%', display: 'flex', justifyContent: 'space-between' }}
      >
        {passFacts.map(({ id, label, value }) => (
          <div key={id} style={{ display: 'flex', flexDirection: 'column', width: '31%' }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4, color: color.accent }}>
              {label.toUpperCase()}
            </div>
            <div style={{ marginTop: 12, fontSize: 40, fontWeight: 500, color: color.secondary }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>,
    {
      width: 1080,
      height: 1920,
      fonts: [
        { name: 'Host Grotesk', data: medium, weight: 500 },
        { name: 'Host Grotesk', data: extraBold, weight: 800 },
      ],
      headers: { 'Cache-Control': 'private, no-store' },
    },
  )
}
