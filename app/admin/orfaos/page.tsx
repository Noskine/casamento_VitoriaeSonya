// app/admin/orfaos/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "../../../lib/admin-auth";
import { listOrphanPayments } from "../../../lib/orphan-store";
import OrphansClient from "./OrphansClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pagamentos órfãos · Admin",
  robots: { index: false, follow: false },
};

export default async function OrphansPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const orphans = await listOrphanPayments();
  return <OrphansClient initialOrphans={orphans} />;
}