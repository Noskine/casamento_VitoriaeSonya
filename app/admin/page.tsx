import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "../../lib/admin-auth";
import { listRsvps } from "../../lib/rsvp-store";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmações · Ana & Lucas",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const rsvps = await listRsvps();

  return <DashboardClient rsvps={rsvps} />;
}