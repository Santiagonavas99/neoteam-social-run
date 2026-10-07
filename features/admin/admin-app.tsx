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
import { type AdminSection, sectionsFor } from './sections'
import { AdminShell } from './shell/admin-shell'
import { TeamView } from './team/team-view'

export function AdminApp() {
  const session = useAdminSession()
  const [picked, setSection] = useState<AdminSection | null>(null)

  if (!session.ready || !session.signedIn) return <AuthScreen session={session} />
  const allowed = sectionsFor(session.role)
  const section = allowed.find((item) => item.id === picked)?.id ?? allowed[0]?.id ?? 'checkin'

  return (
    <AdminShell
      sections={allowed}
      section={section}
      onNavigate={setSection}
      onSignOut={() => void session.signOut()}
    >
      {section === 'checkin' ? (
        <CheckinView />
      ) : section === 'logos' ? (
        <LogosView />
      ) : section === 'team' ? (
        <TeamView />
      ) : section === 'participants' ? (
        <ParticipantsView />
      ) : section === 'groups' || section === 'brands' ? (
        <CommunityView key={section} resource={section} />
      ) : section === 'dynamics' ? (
        <DynamicsView />
      ) : (
        <OverviewView navigate={setSection} />
      )}
    </AdminShell>
  )
}
