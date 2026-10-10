/** Suggest an editable display name from a descriptive image filename. */
export function nameFromLogoFilename(filename: string): string {
  const raw = filename
    .replace(/\.[^.]+$/, '')
    .replace(/^(?:logo|logotipo)[\s_-]+/i, '')
    .replace(/[\s_-]+/g, ' ')
    .trim()
  if (
    raw.length < 3 ||
    raw.length > 120 ||
    /^(?:img|dsc|image|foto|captura|screenshot|whatsapp)(?:\s|\d|$)/i.test(raw) ||
    /^\d+$/.test(raw)
  )
    return ''
  return raw
}
