import Link from 'next/link'
import { NeoTeamLogo } from './neoteam-logo'

export function BrandLink({ label = 'NeoTeam' }: { label?: string }) {
  return (
    <Link href="/" className="brand" aria-label={label}>
      <NeoTeamLogo className="h-8 w-auto md:h-9" />
    </Link>
  )
}
