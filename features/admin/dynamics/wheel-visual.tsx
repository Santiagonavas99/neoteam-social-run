'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { buildWheelSectors, targetRotation, type WheelPrize } from './wheel-model'

export type SpinVisual = {
  id: number
  prize: string | null
  demo?: boolean
}

const CENTER = 160
const RADIUS = 151
const TOTAL_MS = 4650

function polar(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(radians), y: CENTER + radius * Math.sin(radians) }
}

function sectorPath(start: number, end: number) {
  const begin = polar(start, RADIUS)
  const finish = polar(end, RADIUS)
  const largeArc = end - start > 180 ? 1 : 0
  return `M ${CENTER} ${CENTER} L ${begin.x} ${begin.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${finish.x} ${finish.y} Z`
}

function linesFor(label: string) {
  const words = label.toUpperCase().split(/\s+/).filter(Boolean)
  let first = ''
  let second = ''
  for (const word of words) {
    if ((first + ' ' + word).trim().length <= 13 && !second) {
      first = (first + ' ' + word).trim()
    } else if ((second + ' ' + word).trim().length <= 12) {
      second = (second + ' ' + word).trim()
    } else {
      second = (second || word).slice(0, 10) + '…'
      break
    }
  }
  if (!first) first = label.slice(0, 12).toUpperCase()
  return second ? [first, second] : [first]
}

export function WheelVisual({
  prizes,
  probability,
  spin,
  onReveal,
  preview,
}: {
  prizes: WheelPrize[]
  probability: number
  spin: SpinVisual | null
  onReveal: () => void
  preview: boolean
}) {
  const sectors = useMemo(() => buildWheelSectors(prizes, probability), [prizes, probability])
  const [rotation, setRotation] = useState(0)
  const [duration, setDuration] = useState(0)
  const [moving, setMoving] = useState(false)
  const rotationRef = useRef(0)
  const lastSpinRef = useRef<number | null>(null)
  const revealRef = useRef(onReveal)
  useEffect(() => {
    revealRef.current = onReveal
  }, [onReveal])

  useEffect(() => {
    if (!spin || spin.id === lastSpinRef.current) return
    lastSpinRef.current = spin.id

    // A settled server result controls the destination. Nothing in the animation
    // is used to choose or persist prizes.
    const target = targetRotation(sectors, spin.prize, rotationRef.current)
    if (target === null) {
      revealRef.current()
      return
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const milliseconds = reduceMotion ? 0 : TOTAL_MS
    setMoving(!reduceMotion)
    setDuration(milliseconds)
    const start = window.setTimeout(
      () => {
        rotationRef.current = target
        setRotation(target)
      },
      reduceMotion ? 0 : 50,
    )
    const end = window.setTimeout(
      () => {
        setMoving(false)
        revealRef.current()
      },
      milliseconds + (reduceMotion ? 0 : 90),
    )
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(end)
    }
  }, [spin?.id])

  const accessible = prizes
    .filter((prize) => prize.remaining > 0)
    .map((prize) => `${prize.label}, ${prize.remaining} disponible(s)`)
    .join('; ')

  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="relative aspect-square w-full drop-shadow-xl">
        <svg
          viewBox="0 0 320 320"
          role="img"
          aria-label={
            sectors.length
              ? `Ruleta de premios. ${accessible}. Resultado comunicado después del giro.`
              : 'Ruleta sin premios configurados. Completa el inventario desde Preparación.'
          }
          className="h-full w-full select-none"
        >
          <title>{sectors.length ? 'Ruleta de premios' : 'Ruleta por configurar'}</title>
          <circle cx={CENTER} cy={CENTER} r={158} fill="#071B1C" stroke="#E6EBE2" strokeWidth="4" />
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: '160px 160px',
              transition:
                duration > 0 ? `transform ${duration}ms cubic-bezier(0.14, 0.78, 0.13, 1)` : 'none',
            }}
          >
            {sectors.length
              ? sectors.map((sector, index) => {
                  const midpoint = (sector.start + sector.end) / 2
                  const point = polar(midpoint, 100)
                  const width = sector.end - sector.start
                  const textLines = width >= 24 ? linesFor(sector.label) : []
                  return (
                    <g key={sector.key}>
                      <path
                        d={sectorPath(sector.start, sector.end)}
                        fill={sector.fill}
                        opacity={index % 2 ? 0.92 : 1}
                        stroke="#092324"
                        strokeWidth="2.8"
                      />
                      {textLines.length > 0 && (
                        <text
                          x={point.x}
                          y={point.y - (textLines.length - 1) * 6}
                          textAnchor="middle"
                          fill={sector.darkText ? '#0C2624' : '#FFFFFF'}
                          fontSize={width < 40 ? 8 : 10}
                          fontWeight="800"
                          letterSpacing="0.15"
                        >
                          {textLines.map((line, lineIndex) => (
                            <tspan key={line} x={point.x} dy={lineIndex ? 12 : 0}>
                              {line}
                            </tspan>
                          ))}
                        </text>
                      )}
                    </g>
                  )
                })
              : Array.from({ length: 8 }, (_, index) => (
                  <g key={String.fromCharCode(65 + index)}>
                    <path
                      d={sectorPath(index * 45, (index + 1) * 45)}
                      fill={index % 2 ? '#204640' : '#2D5951'}
                      stroke="#092324"
                      strokeWidth="3"
                    />
                  </g>
                ))}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={136}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3"
              opacity="0.32"
            />
          </g>
          <circle cx={CENTER} cy={CENTER} r={57} fill="#082321" stroke="#E0EFE4" strokeWidth="5" />
          <circle cx={CENTER} cy={CENTER} r={49} fill="#0C3430" />
          <text
            x={CENTER}
            y={CENTER - 14}
            textAnchor="middle"
            fill="#AFFFE7"
            fontSize="10"
            fontWeight="800"
            letterSpacing="2"
          >
            NEO TEAM
          </text>
          <text
            x={CENTER}
            y={CENTER + 10}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="18"
            fontWeight="900"
          >
            {sectors.length ? 'GIRA' : 'LISTA'}
          </text>
          <text x={CENTER} y={CENTER + 28} textAnchor="middle" fill="#C5E8DC" fontSize="9">
            {sectors.length ? 'Y GANA' : 'SIN PREMIOS'}
          </text>
          <path
            d="M 160 29 L 146 4 Q 160 -2 174 4 Z"
            fill="#F5C84B"
            stroke="#062524"
            strokeWidth="3"
          />
          <circle cx={160} cy={4} r={5} fill="#FFFFFF" />
        </svg>
      </div>
      <p className="mt-1 text-center text-xs font-medium text-neo-text-secondary" role="status">
        {moving
          ? 'Girando… el premio ya fue determinado por el servidor.'
          : preview
            ? 'Vista previa. No se registran premios ni participaciones.'
            : sectors.length
              ? 'El resultado oficial se guarda antes de mostrar la animación.'
              : 'Agrega premios desde Preparación para habilitar los giros.'}
      </p>
    </div>
  )
}
