import Link from "next/link";
import { AdminDashboard } from "./admin-dashboard";

export default function AdminPage() {
  return <>
    <AdminDashboard />
    <Link href="/admin/checkin" className="checkin-floating-link">Escáner QR ↗</Link>
  </>;
}
