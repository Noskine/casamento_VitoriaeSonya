import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "../../lib/admin-auth";
import { listRsvps } from "../../lib/rsvp-store";
import { listGifts } from "../../lib/gift-store";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel · Ana & Lucas",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const [rsvps, gifts] = await Promise.all([
    listRsvps(),
    listGifts({ includeInactive: true }),
  ]);

  return <DashboardClient rsvps={rsvps} gifts={gifts} />;
}