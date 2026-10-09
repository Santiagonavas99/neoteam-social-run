/**
 * Fade the whole walkthrough near the viewport edges, in both scroll directions.
 * Long mobile sections remain fully visible while the reader moves through them.
 */
export function sectionFadeOpacity(
  top: number,
  bottom: number,
  viewportHeight: number,
): number {
  if (viewportHeight <= 0 || bottom <= top) return 1

  const distance = Math.min(240, Math.max(120, viewportHeight * 0.25))
  const entering = (viewportHeight - top) / distance
  const leaving = bottom / distance
  return Math.max(0, Math.min(1, entering, leaving))
}
