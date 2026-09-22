import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated  } from "../../../lib/admin-auth";
import LoginForm from "./LoginForm";


export const metadata: Metadata = {
  title: "Admin · Vitória & Enikson",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <LoginForm />
    </main>
  );
}