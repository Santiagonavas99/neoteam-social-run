'use client'

import { Copy, Dices, Gift, MonitorPlay, Play, Settings2, Target, Trophy, Zap } from 'lucide-react'
import { dynamicStates, dynamicTypes } from '../labels'
import type { DynamicRow } from '../types'
import { StatusBadge } from '../ui/admin-ui'
import { challengeNeedsRules } from './dynamics-order'
import styles from './dynamics-tabs.module.css'

const typeIcons = {
  raffle: Dices,
  challenge: Target,
  instant_win: Gift,
}

export function DynamicCard({
  row,
  onOpen,
  onRepeat,
  onPreview,
}: {
  row: DynamicRow
  onOpen: () => void
  onRepeat: () => void
  onPreview: () => void
}) {
  const TypeIcon = typeIcons[row.type as keyof typeof typeIcons] ?? Zap
  const active = row.status === 'open'
  const draft = row.status === 'draft'
  const needsRules = draft && challengeNeedsRules(row)

  return (
    <article data-status={row.status} className={styles.dynamicCard}>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={styles.cardKind}>
            <TypeIcon aria-hidden className="size-4" />
            {dynamicTypes[row.type]}
          </span>
          <StatusBadge status={row.status} label={dynamicStates[row.status]} />
        </div>
        <h4 className="m-0 mt-3 text-lg font-black tracking-tight break-words">{row.name}</h4>
        <p className="m-0 mt-1 line-clamp-2 text-sm text-neo-text-secondary">
          {row.prize || row.description || 'Actividad del Social Run'}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neo-text-secondary">
          <span>{row.participations_count ?? 0} participaciones</span>
          {row.type === 'raffle' && <span>{row.winner_count} premios</span>}
          <span>{row.requires_checkin ? 'Con check-in' : 'Sin check-in'}</span>
        </div>
        {needsRules && (
          <p className="m-0 mt-3 text-xs font-bold text-neo-warning">
            Falta definir cómo completar el reto
          </p>
        )}
      </div>
      <div className={styles.cardActions}>
        <button
          type="button"
          className={active ? styles.playAction : styles.secondaryAction}
          onClick={onOpen}
        >
          {active ? (
            <>
              <Play aria-hidden className="size-4" /> Abrir control
            </>
          ) : draft ? (
            <>
              <Settings2 aria-hidden className="size-4" />
              {row.type === 'challenge' ? 'Configurar reto' : 'Preparar dinámica'}
            </>
          ) : (
            <>
              <Trophy aria-hidden className="size-4" /> Ver resultados
            </>
          )}
        </button>
        {(row.status === 'completed' || row.status === 'closed') && (
          <button type="button" className={styles.secondaryAction} onClick={onRepeat}>
            <Copy aria-hidden className="size-4" /> Repetir
          </button>
        )}
        {active && (
          <button
            type="button"
            className={`${styles.screenLink} hidden md:inline-flex`}
            onClick={onPreview}
          >
            <MonitorPlay aria-hidden className="size-4" /> Pantalla pública
          </button>
        )}
      </div>
    </article>
  )
}
