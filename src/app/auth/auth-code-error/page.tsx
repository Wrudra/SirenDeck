import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-bold">Couldn&rsquo;t complete sign-in</h1>
        <p className="text-sm text-foreground/60">
          The confirmation link is invalid or has expired. Please try signing in
          again.
        </p>
        <Link
          href="/login"
          className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
