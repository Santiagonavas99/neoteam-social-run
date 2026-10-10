'use client'

import { useState } from 'react'
import { AdminPresenceTracker } from './auth/admin-presence-tracker'
import { AuthScreen } from './auth/auth-screen'
import { useAdminSession } from './auth/use-admin-session'
import { CheckinView } from './checkin/checkin-view'
import { CommunityView } from './community/community-view'
import { DynamicsView } from './dynamics/dynamics-view'
import { HomeOrderView } from './home-order/home-order-view'
import { LogosView } from './logos/logos-view'
import { OverviewView } from './overview/overview-view'
import { ParticipantsView } from './participants/participants-view'
import { PendingEmailsView } from './participants/pending-emails-view'
import { RegistrationSettingsView } from './registration-settings/registration-settings-view'
import { type AdminSection, sectionsFor } from './sections'
import { AdminShell } from './shell/admin-shell'
import { TeamView } from './team/team-view'

export function AdminApp({ enableLegacyWebpMigration }: { enableLegacyWebpMigration: boolean }) {
  const session = useAdminSession()
  const [picked, setSection] = useState<AdminSection | null>(null)

  if (!session.ready || !session.signedIn) return <AuthScreen session={session} />
  const allowed = sectionsFor(session.role)
  const section = allowed.find((item) => item.id === picked)?.id ?? allowed[0]?.id ?? 'checkin'

  return (
    <>
      {session.role === 'admin' ? <AdminPresenceTracker /> : null}
      <AdminShell
        sections={allowed}
        section={section}
        onNavigate={setSection}
        onSignOut={() => void session.signOut()}
        showPresence={session.role === 'admin'}
      >
        {section === 'checkin' ? (
          <CheckinView />
        ) : section === 'registration-settings' ? (
          <RegistrationSettingsView />
        ) : section === 'home-order' ? (
          <HomeOrderView />
        ) : section === 'logos' ? (
          <LogosView
            enableLegacyWebpMigration={enableLegacyWebpMigration}
            onNavigateKind={(kind) => setSection(kind === 'brand' ? 'logos' : 'race-logos')}
          />
        ) : section === 'race-logos' ? (
          <LogosView
            kind="race"
            enableLegacyWebpMigration={false}
            onNavigateKind={(kind) => setSection(kind === 'brand' ? 'logos' : 'race-logos')}
          />
        ) : section === 'team' ? (
          <TeamView />
        ) : section === 'participants' ? (
          <ParticipantsView />
        ) : section === 'email-queue' ? (
          <PendingEmailsView />
        ) : section === 'groups' || section === 'brands' ? (
          <CommunityView key={section} resource={section} />
        ) : section === 'dynamics' ? (
          <DynamicsView />
        ) : (
          <OverviewView navigate={setSection} />
        )}
      </AdminShell>
    </>
  )
}
