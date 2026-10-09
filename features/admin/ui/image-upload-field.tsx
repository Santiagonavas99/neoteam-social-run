import { ImagePlus, ImageUp } from 'lucide-react'
import { type ChangeEvent, useState } from 'react'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import type { FeedbackValue } from '../types'
import { Logo } from './admin-ui'
import { prepareImageForUpload, type UploadImageMime } from './image-processing'

function readFileAsBase64(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () =>
      reject(new Error('No pudimos leer la imagen. Intenta seleccionar el archivo otra vez.'))
    reader.readAsDataURL(file)
  })
}

export async function uploadAdminImage(blob: Blob, mime: UploadImageMime): Promise<string> {
  const content = await readFileAsBase64(blob)
  const result = await callAdmin('uploadAdminImage', { mime, content })
  if (!result.url) throw new Error('No pudimos obtener la imagen subida.')
  return result.url
}

export function useImageUpload({
  successText,
  onUploaded,
  setFeedback,
}: {
  successText: string
  onUploaded: (url: string) => void
  setFeedback: (value: FeedbackValue) => void
}) {
  const [uploading, setUploading] = useState(false)

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    setUploading(true)
    setFeedback(null)
    try {
      const processed = await prepareImageForUpload(file)
      const url = await uploadAdminImage(processed.blob, processed.mime)
      onUploaded(url)
      const savings = Math.round((1 - processed.blob.size / file.size) * 100)
      setFeedback({
        kind: 'success',
        text: processed.webp
          ? `${successText} ${savings > 0 ? `WEBP optimizado: ${savings}% menos peso.` : 'Imagen WEBP lista.'}`
          : `${successText} Archivo ${processed.mime === 'image/png' ? 'PNG' : 'JPG'} compatible con tu navegador${savings > 0 ? ` · ${savings}% menos peso.` : '.'}`, 
      })
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
    <label className="col-span-full flex-row! items-start gap-3 rounded-control border border-dashed border-neo-border-strong bg-neo-bg p-4 md:items-center md:gap-5 md:p-5">
      <span className="hidden md:contents">
        <Logo url={url} name={name || 'Logo'} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <strong className="inline-flex items-center gap-2">
          {url ? (
            <ImageUp aria-hidden className="size-4 shrink-0" />
          ) : (
            <ImagePlus aria-hidden className="size-4 shrink-0" />
          )}
          {uploading ? 'Convirtiendo y subiendo imagen…' : `${url ? 'Cambiar' : 'Añadir'} ${noun}`}
        </strong>
        <small className="font-normal text-neo-text-secondary">{hint}</small>
        <input
          className="min-h-11 border-0! bg-transparent! px-0! py-1! text-xs! file:mr-3 file:min-h-9 file:cursor-pointer file:rounded-[6px] file:border file:border-solid file:border-neo-border-strong file:bg-neo-surface file:px-3 file:py-1.5 file:text-neo-text"
          type="file"
          accept="image/*,.heic,.heif"
          onChange={(event) => void onChange(event)}
          aria-label={`Seleccionar ${noun}`}
        />
      </span>
    </label>
  )
}
