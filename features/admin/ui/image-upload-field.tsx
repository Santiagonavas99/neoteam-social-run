import { ImagePlus, ImageUp } from 'lucide-react'
import { type ChangeEvent, useState } from 'react'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import type { FeedbackValue } from '../types'
import { Logo } from './admin-ui'
import { prepareImageForUpload, type UploadImageMime } from './image-processing'
import styles from './image-upload-field.module.css'

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
  const [uploadFeedback, setUploadFeedback] = useState<FeedbackValue>(null)

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    setUploading(true)
    setFeedback(null)
    setUploadFeedback(null)
    try {
      const processed = await prepareImageForUpload(file)
      const url = await uploadAdminImage(processed.blob, processed.mime)
      onUploaded(url)
      const savings = Math.round((1 - processed.blob.size / file.size) * 100)
      setUploadFeedback({
        kind: 'success',
        text: processed.webp
          ? `${successText} ${savings > 0 ? `WEBP optimizado: ${savings}% menos peso.` : 'Imagen WEBP lista.'}`
          : `${successText} Archivo ${processed.mime === 'image/png' ? 'PNG' : 'JPG'} compatible con tu navegador${savings > 0 ? ` · ${savings}% menos peso.` : '.'}`,
      })
    } catch (error) {
      setUploadFeedback({ kind: 'error', text: errorMessage(error, 'No pudimos subir la imagen.') })
    } finally {
      setUploading(false)
      input.value = ''
    }
  }

  return { uploading, upload, uploadFeedback }
}

export function ImageUploadField({
  url,
  name,
  uploading,
  noun,
  hint,
  uploadFeedback,
  onChange,
}: {
  url?: string | null
  name: string
  uploading: boolean
  noun: 'logo' | 'imagen'
  hint: string
  uploadFeedback?: FeedbackValue
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="col-span-full min-w-0">
      <label className={styles.picker}>
        <span className={styles.preview}>
          <Logo url={url} name={name || 'Logo'} />
        </span>
        <span className={styles.copy}>
          <span className={styles.heading}>
            {url ? (
              <ImageUp aria-hidden className="size-4 shrink-0" />
            ) : (
              <ImagePlus aria-hidden className="size-4 shrink-0" />
            )}
            {uploading ? 'Procesando imagen…' : url ? `Cambiar ${noun}` : `Añadir ${noun}`}
            {url && <span className={styles.ready}>Logo listo</span>}
          </span>
          <span className={styles.hint}>{hint}</span>
          <span className={styles.action}>
            {uploading
              ? 'Subiendo imagen…'
              : url
                ? 'Elegir otra imagen'
                : 'Seleccionar imagen'}
          </span>
        </span>
        <input
          className="sr-only"
          type="file"
          accept="image/*,.heic,.heif"
          disabled={uploading}
          onChange={onChange}
          aria-label={`Seleccionar ${noun}`}
        />
      </label>
      {uploadFeedback && (
        <p
          className={`feedback feedback-${uploadFeedback.kind} mb-0! mt-3 flex items-start gap-2 text-sm`}
          role={uploadFeedback.kind === 'error' ? 'alert' : 'status'}
        >
          {uploadFeedback.text}
        </p>
      )}
      {url && (
        <p className="mb-0! mt-3 text-xs text-neo-text-secondary">
          Imagen subida. El cambio será visible cuando guardes el registro.
        </p>
      )}
    </div>
  )
}

/** The existing one-time migration requires genuine WebP uploads. */
export function uploadWebpImage(blob: Blob): Promise<string> {
  return uploadAdminImage(blob, 'image/webp')
}
