import Link from 'next/link'

export function BrandLink({ label }: { label?: string }) {
  return (
    <Link href="/" className="brand" aria-label={label}>
      <span className="brand-mark">N</span>
      <span>NEOTEAM</span>
    </Link>
  )
}
