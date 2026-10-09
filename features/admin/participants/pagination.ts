/**
 * Avoid reverting a newly requested page using data from an older response.
 *
 * The server can clamp a requested page after deletions or filtering. Only
 * reconcile when the response belongs to the current requested page.
 */
export function pageCorrection(
  requestedPage: number,
  responseRequestedPage: number,
  responsePage: number,
): number | null {
  if (responseRequestedPage !== requestedPage || responsePage === requestedPage) {
    return null
  }
  return responsePage
}
