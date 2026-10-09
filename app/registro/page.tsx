import { QrCode, Users } from 'lucide-react'
import Link from 'next/link'
import { linkClass } from '@/features/registration/form-ui'
import { RegistrationAvailability } from '@/features/registration/registration-availability'
import { isRegistrationClosed } from '@/features/registration/registration-deadline'
import { eventFacts, RegistrationShell } from '@/features/registration/registration-shell'

export const dynamic = 'force-dynamic'

export default function RegistrationPage() {
  return (
    <RegistrationShell
      title={['Reserva', 'tu lugar.']}
      intro="Regístrate gratis en tres pasos: tus datos, tu running crew (o participación independiente) y un contacto de emergencia. Al final podrás confirmar tu inscripción."
      facts={[...eventFacts, { icon: Users, label: 'Formato', value: 'Social Run · comunidad' }]}
      aside={
        <Link href="/pase" className={`${linkClass} mt-2`}>
          <QrCode aria-hidden className="size-4 shrink-0" />
          ¿Ya te inscribiste? Recupera tu pase
        </Link>
      }
    >
      <RegistrationAvailability initiallyClosed={isRegistrationClosed()} />
    </RegistrationShell>
  )
}
