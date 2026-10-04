"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export function HorizontalCarousel({ children, ariaLabel, className = "" }: {
  children: ReactNode; ariaLabel: string; className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const id = useId();
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => {
      const start = element.scrollLeft <= 2;
      const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2;
      setEdges(previous => previous.start === start && previous.end === end ? previous : { start, end });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    Array.from(element.children).forEach(child => observer.observe(child));
    element.addEventListener("scroll", measure, { passive: true });
    measure();
    return () => { observer.disconnect(); element.removeEventListener("scroll", measure); };
  }, [children]);

  function move(direction: number) {
    const element = track.current;
    if (!element) return;
    const first = element.firstElementChild;
    const distance = first ? first.getBoundingClientRect().width + parseFloat(getComputedStyle(element).columnGap || "0") : element.clientWidth;
    element.scrollBy({ left: direction * distance, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return <div className={`horizontal-carousel ${className}`} role="region" aria-label={ariaLabel} aria-roledescription="carrusel">
    <div className="carousel-controls" hidden={edges.start && edges.end}>
      <button type="button" aria-label="Anterior" aria-controls={id} disabled={edges.start} onClick={() => move(-1)}>←</button>
      <button type="button" aria-label="Siguiente" aria-controls={id} disabled={edges.end} onClick={() => move(1)}>→</button>
    </div>
    <div id={id} ref={track} className="carousel-track" tabIndex={0} aria-label={`${ariaLabel}: desplaza para ver más`} onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); }
    }}>{children}</div>
  </div>;
}
