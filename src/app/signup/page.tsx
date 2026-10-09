import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "../auth-form";
import { AuthSplit } from "../auth-split";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a free SirenDeck account and build your Money Map in minutes.",
};

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  return (
    <AuthSplit
      title="Create an account"
      lede="Free while SirenDeck is in early access. No card."
      prompt="Already have one?"
      alternateHref="/login"
      alternateLabel="Sign in"
    >
      <AuthForm mode="signup" />
    </AuthSplit>
  );
}
