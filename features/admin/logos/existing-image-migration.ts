import { callAdmin, callLogos } from '../api'
import { errorMessage } from '../errors'
import type { CommunityRecord, LogoItem } from '../types'
import { convertImageToWebp } from '../ui/image-processing'
import { uploadWebpImage } from '../ui/image-upload-field'
import { canPreserveSlug, isExistingStoredImage } from './migration-guards'

type CommunitySource = 'groups' | 'brands'
type Source = CommunitySource | 'logos'
type Item = CommunityRecord | LogoItem

export type ExistingImageCandidate = {
  source: Source
  id: string
  name: string
  originalUrl: string
}

export type MigrationProgress = {
  index: number
  total: number
  name: string
}

export type MigrationSummary = {
  converted: number
  skipped: number
  failed: string[]
}

function candidatesFor(source: Source, rows: Item[]): ExistingImageCandidate[] {
  return rows.flatMap((row) =>
    isExistingStoredImage(row.logo_url)
      ? [{ source, id: row.id, name: row.name, originalUrl: row.logo_url as string }]
      : [],
  )
}

export async function listExistingImageCandidates(): Promise<ExistingImageCandidate[]> {
  const [logos, groups, brands] = await Promise.all([
    callLogos<LogoItem>('list'),
    callAdmin<CommunityRecord>('adminData', { resource: 'groups', operation: 'list' }),
    callAdmin<CommunityRecord>('adminData', { resource: 'brands', operation: 'list' }),
  ])
  return [
    ...candidatesFor('logos', logos.rows ?? []),
    ...candidatesFor('groups', groups.rows ?? []),
    ...candidatesFor('brands', brands.rows ?? []),
  ]
}

async function latestRow(candidate: ExistingImageCandidate): Promise<Item | undefined> {
  if (candidate.source === 'logos') {
    const result = await callLogos<LogoItem>('list')
    return result.rows?.find((row) => row.id === candidate.id)
  }
  const result = await callAdmin<CommunityRecord>('adminData', {
    resource: candidate.source,
    operation: 'list',
  })
  return result.rows?.find((row) => row.id === candidate.id)
}

async function convertStoredFile(url: string): Promise<string> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No fue posible descargar el archivo original.')
  const blob = await response.blob()
  const name = new URL(url).pathname.split('/').pop() ?? 'original.png'
  const file = new File([blob], name, { type: blob.type })
  const webp = await convertImageToWebp(file)
  return uploadWebpImage(webp)
}

export async function migrateExistingImages(
  candidates: ExistingImageCandidate[],
  onProgress: (progress: MigrationProgress) => void,
): Promise<MigrationSummary> {
  const summary: MigrationSummary = { converted: 0, skipped: 0, failed: [] }
  const convertedUrls = new Map<string, string>()

  for (const [index, candidate] of candidates.entries()) {
    onProgress({ index: index + 1, total: candidates.length, name: candidate.name })
    try {
      const current = await latestRow(candidate)
      if (!current || current.logo_url !== candidate.originalUrl) {
        summary.skipped++
        continue
      }
      if (candidate.source !== 'logos' && !canPreserveSlug(current as CommunityRecord)) {
        summary.skipped++
        continue
      }

      let webpUrl = convertedUrls.get(candidate.originalUrl)
      if (!webpUrl) {
        webpUrl = await convertStoredFile(candidate.originalUrl)
        convertedUrls.set(candidate.originalUrl, webpUrl)
      }

      // Re-read immediately before changing the DB reference to avoid overwriting another edit.
      const latest = await latestRow(candidate)
      if (!latest || latest.logo_url !== candidate.originalUrl) {
        summary.skipped++
        continue
      }
      if (candidate.source === 'logos') {
        await callLogos('save', { values: { ...latest, logo_url: webpUrl } })
      } else {
        const community = latest as CommunityRecord
        if (!canPreserveSlug(community)) {
          summary.skipped++
          continue
        }
        await callAdmin('adminData', {
          resource: candidate.source,
          operation: 'save',
          values: { id: community.id, name: community.name, logo_url: webpUrl },
        })
      }
      summary.converted++
    } catch (error) {
      summary.failed.push(`${candidate.name}: ${errorMessage(error, 'No se pudo convertir.')}`)
    }
  }

  return summary
}
