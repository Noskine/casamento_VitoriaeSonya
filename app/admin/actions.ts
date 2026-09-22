"use server";

import { redirect } from "next/navigation";
import { login, logout } from "../../lib/admin-auth";

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Digite a senha." };

  const ok = await login(password);
  if (!ok) return { error: "Senha incorreta." };

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/admin/login");
}