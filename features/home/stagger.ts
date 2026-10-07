import type { CSSProperties } from 'react'

// Position in a staggered group; `reveal` and the hero keyframes read it as --i.
export const stagger = (i: number) => ({ '--i': i }) as CSSProperties
