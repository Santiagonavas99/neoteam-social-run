import type { Metadata } from 'next'
import { ClaimForm } from '@/features/registration/claim-form'
import { eventFacts, RegistrationShell } from '@/features/registration/registration-shell'

export const metadata: Metadata = {
  title: 'Tu pase · Social Run NeoTeam',
  robots: { index: false },
}

export default function PassPage() {
  return (
    <RegistrationShell
      title={['Un QR.', 'Y a correr.']}
      intro="Tu pase identifica tu inscripción y nos permite hacer el check-in rápido el día del evento."
      facts={eventFacts}
    >
      <ClaimForm />
    </RegistrationShell>
  )
}
