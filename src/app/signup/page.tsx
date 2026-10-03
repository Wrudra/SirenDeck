import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "../auth-form";
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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0a0e14] px-6 py-16 text-[#e8ecf4]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex h-1.5">
        <div className="flex-1 bg-[#0f766e]" />
        <div className="flex-1 bg-[#65a30d]" />
        <div className="flex-1 bg-[#d97706]" />
        <div className="flex-1 bg-[#ea580c]" />
        <div className="flex-1 bg-[#dc2626]" />
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide">
            <span aria-hidden className="inline-block size-4 rounded-[5px] bg-[#dc2626]" />
            SirenDeck
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Create your map</h1>
          <p className="text-sm text-[#8b94a7]">
            Free during early access. No card required.
          </p>
        </div>

        <AuthForm mode="signup" />

        <p className="text-sm text-[#8b94a7]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#4cc2ff] hover:underline">
            Sign in
          </Link>
        </p>
        <Link href="/" className="text-xs text-[#8b94a7] transition-colors hover:text-[#e8ecf4]">
          Back to home
        </Link>
      </div>
    </main>
  );
}
