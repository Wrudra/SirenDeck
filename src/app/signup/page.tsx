import Link from "next/link";

import AuthForm from "../auth-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold">Create your SirenDeck account</h1>
        <AuthForm mode="signup" />
        <p className="text-sm text-foreground/60">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
        <Link href="/" className="text-sm text-foreground/60 underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
