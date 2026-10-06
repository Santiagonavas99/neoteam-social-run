'use client'

import { useState } from 'react'
import { AuthScreen } from './auth/auth-screen'
import { useAdminSession } from './auth/use-admin-session'
import { CheckinView } from './checkin/checkin-view'
import { CommunityView } from './community/community-view'
import { DynamicsView } from './dynamics/dynamics-view'
import { LogosView } from './logos/logos-view'
import { OverviewView } from './overview/overview-view'
import { ParticipantsView } from './participants/participants-view'
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
      {section === 'checkin' ? (
        <CheckinView token={token} />
      ) : section === 'logos' ? (
        <LogosView token={token} />
      ) : section === 'security' ? (
        <ChangePinForm token={token} onToken={session.remember} />
      ) : section === 'participants' ? (
        <ParticipantsView token={token} />
      ) : section === 'groups' || section === 'brands' ? (
        <CommunityView key={section} resource={section} token={token} />
      ) : section === 'dynamics' ? (
        <DynamicsView token={token} />
      ) : (
        <OverviewView token={token} navigate={setSection} />
      )}
    </AdminShell>
  )
}
