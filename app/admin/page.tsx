import { AdminApp } from '@/features/admin/admin-app'

export default function AdminPage() {
  return <AdminApp enableLegacyWebpMigration={process.env.VERCEL_ENV === 'production'} />
}
