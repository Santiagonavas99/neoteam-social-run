import qrcode from 'qrcode-generator'

export const QR_PREFIX = 'NEOTEAM-SR26:'

// An SVG data URL renders crisp at any size and lets phones long-press to save the image.
// margin 32 = the 4-module quiet zone scanners need, since the pass bib around it is black.
export function passQrDataUrl(checkinToken: string) {
  const qr = qrcode(0, 'M')
  qr.addData(`${QR_PREFIX}${checkinToken}`)
  qr.make()
  const svg = qr.createSvgTag({ cellSize: 8, margin: 32, scalable: true })
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
