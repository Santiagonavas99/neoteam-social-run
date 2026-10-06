'use client'

import { type ReactNode, useEffect, useId, useRef, useState } from 'react'

export function HorizontalCarousel({
  children,
  ariaLabel,
  className = '',
}: {
  children: ReactNode
  ariaLabel: string
  className?: string
}) {
  const track = useRef<HTMLDivElement>(null)
  const id = useId()
  const [edges, setEdges] = useState({ start: true, end: true })

  useEffect(() => {
    const element = track.current
    if (!element) return
    const measure = () => {
      const start = element.scrollLeft <= 2
      const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2
      setEdges((previous) =>
        previous.start === start && previous.end === end ? previous : { start, end },
      )
    }
    const resizes = new ResizeObserver(measure)
    const observeSlides = () => {
      resizes.observe(element)
      for (const child of element.children) resizes.observe(child)
    }
    // Slides arrive after mount when the home data loads; re-observe and re-measure.
    const slides = new MutationObserver(() => {
      observeSlides()
      measure()
    })
    observeSlides()
    slides.observe(element, { childList: true })
    element.addEventListener('scroll', measure, { passive: true })
    measure()
    return () => {
      resizes.disconnect()
      slides.disconnect()
      element.removeEventListener('scroll', measure)
    }
  }, [])

  function move(direction: number) {
    const element = track.current
    if (!element) return
    const first = element.firstElementChild
    const distance = first
      ? first.getBoundingClientRect().width + parseFloat(getComputedStyle(element).columnGap || '0')
      : element.clientWidth
    element.scrollBy({
      left: direction * distance,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  return (
    <div
      className={`horizontal-carousel ${className}`}
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carrusel"
    >
      <div className="carousel-controls" hidden={edges.start && edges.end}>
        <button
          type="button"
          aria-label="Anterior"
          aria-controls={id}
          disabled={edges.start}
          onClick={() => move(-1)}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Siguiente"
          aria-controls={id}
          disabled={edges.end}
          onClick={() => move(1)}
        >
          →
        </button>
      </div>
      <div
        id={id}
        ref={track}
        className="carousel-track"
        tabIndex={0}
        aria-label={`${ariaLabel}: desplaza para ver más`}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault()
            move(event.key === 'ArrowLeft' ? -1 : 1)
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
