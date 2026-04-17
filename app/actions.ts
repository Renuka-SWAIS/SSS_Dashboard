"use server";

import { signIn, signOut } from "@/auth";

export async function continueWithGoogle(formData: FormData) {
  const rawRole = formData.get("role");
  const role = typeof rawRole === "string" && rawRole.trim() ? rawRole : "guest";

  await signIn("google", {
    redirectTo: `/dashboard?role=${encodeURIComponent(role)}`,
  });
}

export async function logout() {
  await signOut({
    redirectTo: "/",
  });
}
