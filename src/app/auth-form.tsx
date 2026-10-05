"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

type Mode = "login" | "signup";

const fieldCls =
  "w-full rounded-[var(--radius-control)] border bg-surface px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-muted";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const uid = useId();
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
    if (name === "password") {
      if (value === "") return "Enter your password.";
      if (value.length < 8) return "Use at least 8 characters.";
    }
    return null;
  }

  function clearFieldError(name: string) {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    for (const [name, value] of [
      ["email", email],
      ["password", password],
    ] as const) {
      const msg = validateField(name, value);
      if (msg) errs[name] = msg;
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = errs.email ? "email" : "password";
      const el = document.getElementById(first);
      el?.focus();
      return;
    }

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
      router.replace("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="w-full rounded-[var(--radius-dialog)] border border-rule bg-surface p-5 text-center sm:p-6">
        <p className="ledger-cap text-[10px] text-ink-muted">Check your inbox</p>
        <p
          className="mt-3 text-sm leading-relaxed text-ink-muted"
          style={{ textWrap: "pretty" }}
        >
          We sent a confirmation link to{" "}
          <span className="font-medium text-ink">{email}</span>. Click it to
          activate your account, then sign in here.
        </p>
      </div>
    );
  }

  const emailId = "email";
  const passwordId = "password";
  const formErrorId = `${uid}-form-err`;

  return (
    <form
      method="post"
      action="#"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={pending || undefined}
      aria-describedby={error ? formErrorId : undefined}
      className="flex w-full flex-col gap-4 rounded-[var(--radius-dialog)] border border-rule bg-surface p-5 sm:p-6"
    >
      <div className="grid gap-1.5">
        <label htmlFor={emailId} className="ledger-cap text-[10px] text-ink-muted">
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError("email");
            if (error) setError(null);
          }}
          onBlur={() => onBlur("email", email)}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? "email-err" : undefined}
          placeholder="you@example.com"
          className={`${fieldCls} ${
            fieldErrors.email
              ? "border-ink focus-visible:ring-2 focus-visible:ring-ink/30"
              : "border-rule-input focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/50"
          }`}
        />
        {fieldErrors.email && (
          <p id="email-err" className="text-xs text-ink">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor={passwordId} className="ledger-cap text-[10px] text-ink-muted">
          Password
        </label>
        <div className="relative">
          <input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
              if (error) setError(null);
            }}
            onBlur={() => onBlur("password", password)}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={
              fieldErrors.password
                ? "password-err"
                : mode === "signup"
                  ? "password-hint"
                  : undefined
            }
            placeholder="At least 8 characters"
            className={`${fieldCls} pr-11 ${
              fieldErrors.password
                ? "border-ink focus-visible:ring-2 focus-visible:ring-ink/30"
                : "border-rule-input focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/50"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-[var(--radius-control)] text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {showPassword ? (
              <EyeOffIcon className="size-4" aria-hidden />
            ) : (
              <EyeIcon className="size-4" aria-hidden />
            )}
          </button>
        </div>
        {fieldErrors.password ? (
          <p id="password-err" className="text-xs text-ink">
            {fieldErrors.password}
          </p>
        ) : mode === "signup" ? (
          <p id="password-hint" className="text-xs text-ink-muted">
            At least 8 characters.
          </p>
        ) : null}
      </div>

      {error && (
        <p
          id={formErrorId}
          role="alert"
          className="rounded-[var(--radius-control)] border border-ink border-l-[3px] bg-surface-2 px-3 py-2 text-xs font-medium text-ink"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="plate mt-1 h-11 w-full rounded-[var(--radius-control)] text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {pending
          ? mode === "signup"
            ? "Creating account…"
            : "Signing in…"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </button>
    </form>
  );
}
