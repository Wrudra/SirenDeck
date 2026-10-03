import Link from "next/link";

import AuthForm from "../auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold">Sign in to SirenDeck</h1>
        <AuthForm mode="login" />
        <p className="text-sm text-foreground/60">
          No account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
        <Link href="/" className="text-sm text-foreground/60 underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
