"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  function validateField(name: string, value: string): string | null {
    if (name === "email") {
      if (value === "") return "Enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Email address must include @ and a domain.";
      }
    }
    if (name === "password" && value.length < 8) {
      return "Use at least 8 characters.";
    }
    return null;
  }

  function onBlur(name: string, value: string) {
    const msg = validateField(name, value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (msg) next[name] = msg;
      else delete next[name];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    for (const [name, value] of [["email", email], ["password", password]] as const) {
      const msg = validateField(name, value);
      if (msg) errs[name] = msg;
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth?mode=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Connection failed. Please try again.");
      }
      const data = (await res.json()) as { needsConfirmation?: boolean };
      if (data.needsConfirmation) {
        setAwaitingConfirmation(true);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const inputBase =
    "w-full rounded-[var(--radius-control)] border bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-ink-muted";

  if (awaitingConfirmation) {
    return (
      <div className="w-full rounded-[var(--radius-dialog)] border border-rule bg-surface p-6 text-center">
        <p className="ledger-cap text-[10px] text-ink-muted">Check your inbox</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
          We sent a confirmation link to <span className="font-medium text-ink">{email}</span>.
          Click it to activate your account, then sign in here.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="ledger-cap text-[10px] text-ink-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => onBlur("email", email)}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? "email-err" : undefined}
          placeholder="you@example.com"
          className={`${inputBase} ${fieldErrors.email ? "border-ink focus-visible:ring-2 focus-visible:ring-ink/30" : "border-rule-input focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/50"}`}
        />
        {fieldErrors.email && (
          <p id="email-err" className="text-xs font-medium">{fieldErrors.email}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="ledger-cap text-[10px] text-ink-muted">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => onBlur("password", password)}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? "password-err" : "password-hint"}
            placeholder="At least 8 characters"
            className={`${inputBase} pr-10 ${fieldErrors.password ? "border-ink focus-visible:ring-2 focus-visible:ring-ink/30" : "border-rule-input focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/50"}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[var(--radius-control)] p-1 text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            {showPassword ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
          </button>
        </div>
        {fieldErrors.password ? (
          <p id="password-err" className="text-xs font-medium">{fieldErrors.password}</p>
        ) : (
          <p id="password-hint" className="text-xs text-ink-muted">
            {mode === "signup" ? "At least 8 characters." : "\u00A0"}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-[var(--radius-control)] border border-ink bg-surface-2 px-3 py-2 text-xs font-medium">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="plate rounded-[var(--radius-control)] px-3 py-2.5 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
