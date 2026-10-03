import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-4xl font-bold tracking-tight">SirenDeck</h1>
      {user ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-foreground/60">Signed in as {user.email}</p>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-foreground/60">
            Authentication foundation ready — sign in to continue.
          </p>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
            >
              Sign in
            </Link>
            <Link href="/signup" className="rounded-md border px-4 py-2 text-sm">
              Create account
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
