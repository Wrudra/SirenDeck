import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "../auth-form";
import { AuthSplit } from "../auth-split";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to SirenDeck to see your Money Map.",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  return (
    <AuthSplit
      title="Sign in"
      lede="Use the email and password for this account."
      prompt="New here?"
      alternateHref="/signup"
      alternateLabel="Create an account"
    >
      <AuthForm mode="login" />
    </AuthSplit>
  );
}
