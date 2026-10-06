'use client'

import { useState } from 'react'
import { AdminManagement } from '@/app/admin/admin-management'
import { LogoCarouselAdmin } from '@/app/admin/logo-carousel-admin'
import { callAdmin } from './api'
import { AuthScreen } from './auth/auth-screen'
import { useAdminSession } from './auth/use-admin-session'
import type { AdminSection } from './sections'
import { ChangePinForm } from './security/change-pin-form'
import { AdminShell } from './shell/admin-shell'

export function AdminApp() {
  const session = useAdminSession()
  const [section, setSection] = useState<AdminSection>('metrics')

  if (!session.ready || !session.token) return <AuthScreen session={session} />
  const token = session.token

  return (
    <AdminShell section={section} onNavigate={setSection} onSignOut={() => void session.signOut()}>
      {section === 'logos' ? (
        <LogoCarouselAdmin token={token} callApi={callAdmin} />
      ) : section === 'security' ? (
        <ChangePinForm token={token} onToken={session.remember} />
      ) : (
        <AdminManagement
          key={section}
          section={section}
          token={token}
          callApi={callAdmin}
          navigate={setSection}
        />
      )}
    </AdminShell>
  )
}
