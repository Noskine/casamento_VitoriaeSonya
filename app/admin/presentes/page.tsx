import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "../../../lib/admin-auth";
import { listGifts } from "../../../lib/gift-store";
import GiftsAdmin from "./GiftsAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Presentes · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminGiftsPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const gifts = await listGifts({ includeInactive: true });
  return <GiftsAdmin initialGifts={gifts} />;
}

