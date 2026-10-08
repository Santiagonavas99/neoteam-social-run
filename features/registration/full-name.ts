/**
 * A single visible full-name field is mapped to the existing first-name and
 * last-name database columns. Multiple words are preserved in their order.
 * This is a best-effort split, since names cannot be classified reliably
 * without asking for separate fields.
 */
export function splitFullName(input: string): { firstName: string; lastName: string } | null {
  const words = input.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return null

  // In a four-or-more-word name, prefer the final two words as surnames.
  // Shorter names take the first word as given name.
  const surnameIndex = words.length >= 4 ? words.length - 2 : 1

  return {
    firstName: words.slice(0, surnameIndex).join(' '),
    lastName: words.slice(surnameIndex).join(' '),
  }
}
