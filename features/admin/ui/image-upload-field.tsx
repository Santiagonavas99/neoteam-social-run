import { ImagePlus, ImageUp } from 'lucide-react'
import { type ChangeEvent, useState } from 'react'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import type { FeedbackValue } from '../types'
import { Logo } from './admin-ui'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () =>
      reject(new Error('No pudimos leer la imagen. Intenta seleccionar el archivo otra vez.'))
    reader.readAsDataURL(file)
  })
}

export function useImageUpload({
  token,
  successText,
  onUploaded,
  setFeedback,
}: {
  token: string
  successText: string
  onUploaded: (url: string) => void
  setFeedback: (value: FeedbackValue) => void
}) {
  const [uploading, setUploading] = useState(false)

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setFeedback({ kind: 'error', text: 'La imagen debe pesar menos de 4 MB.' })
      input.value = ''
      return
    }
    setUploading(true)
    setFeedback(null)
    try {
      const content = await readFileAsBase64(file)
      const result = await callAdmin('uploadAdminImage', { token, mime: file.type, content })
      if (!result.url) throw new Error('No pudimos obtener la imagen subida.')
      onUploaded(result.url)
      setFeedback({ kind: 'success', text: successText })
    } catch (error) {
      setFeedback({ kind: 'error', text: errorMessage(error, 'No pudimos subir la imagen.') })
    } finally {
      setUploading(false)
      input.value = ''
    }
  }

  return { uploading, upload }
}

export function ImageUploadField({
  url,
  name,
  uploading,
  noun,
  hint,
  onChange,
}: {
  url?: string | null
  name: string
  uploading: boolean
  noun: 'logo' | 'imagen'
  hint: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="upload-field span-full">
      <Logo url={url} name={name || 'Logo'} />
      <span>
        <strong className="inline-flex items-center gap-2">
          {url ? (
            <ImageUp aria-hidden className="size-4 shrink-0" />
          ) : (
            <ImagePlus aria-hidden className="size-4 shrink-0" />
          )}
          {uploading ? 'Subiendo imagen…' : `${url ? 'Cambiar' : 'Añadir'} ${noun}`}
        </strong>
        <small>{hint}</small>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => void onChange(event)}
          aria-label="Seleccionar logo"
        />
      </span>
    </label>
  )
}
