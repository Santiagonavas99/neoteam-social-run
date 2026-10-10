/**
 * Clipboard.write must be invoked during the original click event, especially
 * on Safari. Pass a Promise<Blob> to ClipboardItem instead of waiting for the
 * asynchronous Canvas rendering before requesting clipboard permission.
 */
export function copyPngToClipboard(
  createPng: () => Promise<Blob>,
  clipboard: Pick<Clipboard, 'write'> | undefined = typeof navigator === 'undefined'
    ? undefined
    : navigator.clipboard,
  ClipboardItemType: typeof ClipboardItem | undefined = typeof ClipboardItem === 'undefined'
    ? undefined
    : ClipboardItem,
): Promise<void> {
  if (!clipboard?.write || !ClipboardItemType) {
    return Promise.reject(
      new Error('Este navegador no permite copiar imágenes. Usa «Exportar imagen».'),
    )
  }

  try {
    const png = createPng().then((blob) => {
      if (blob.type !== 'image/png' || !blob.size) {
        throw new Error('No pudimos generar el PNG para copiar.')
      }
      return blob
    })
    // Do not await rendering here: Safari loses transient user activation.
    const item = new ClipboardItemType({ 'image/png': png })
    return Promise.all([clipboard.write([item]), png]).then(() => undefined)
  } catch (error) {
    return Promise.reject(error)
  }
}
