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
  const [notice, setNotice] = useState(false);

  function emailError(value: string): string | null {
    if (value === "") return "Enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Email address must include @ and a domain.";
    }
    return null;
  }

  function passwordError(value: string): string | null {
    if (value === "") return "Enter your password.";
    if (value.length < 8) return "Use at least 8 characters.";
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

  async function post(authMode: string, body: Record<string, string>) {
    const res = await fetch(`/api/auth?mode=${authMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      needsConfirmation?: boolean;
    };
    if (!res.ok) {
      throw new Error(data.error ?? "Connection failed. Please try again.");
    }
    return data;
  }

  async function signInWithPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const emailMsg = emailError(email);
    const passwordMsg = passwordError(password);
    if (emailMsg) errs.email = emailMsg;
    if (passwordMsg) errs.password = passwordMsg;
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      document.getElementById(errs.email ? "email" : "password")?.focus();
      return;
    }
    setPending(true);
    setError(null);
    try {
      const data = await post(mode === "signup" ? "signup" : "login", { email, password });
      if (data.needsConfirmation) {
        setNotice(true);
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

  if (notice) {
    return (
      <div className="w-full rounded-[var(--radius-dialog)] border border-rule bg-surface p-5 text-center sm:p-6">
        <p className="ledger-cap text-[10px] text-ink-muted">Check your inbox</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
          We sent a confirmation link to <span className="font-medium text-ink">{email}</span>.
          Click it, then sign in here.
        </p>
      </div>
    );
  }

  const formErrorId = `${uid}-form-err`;

  return (
    <form
      method="post"
      action="#"
      onSubmit={signInWithPassword}
      noValidate
      aria-busy={pending || undefined}
      aria-describedby={error ? formErrorId : undefined}
      className="flex w-full flex-col gap-5"
    >
      <div className="grid gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
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
          onBlur={() => {
            const msg = emailError(email);
            setFieldErrors((prev) => {
              const next = { ...prev };
              if (msg) next.email = msg;
              else delete next.email;
              return next;
            });
          }}
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
        <label htmlFor="password" className="text-sm font-medium">
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
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
              if (error) setError(null);
            }}
            onBlur={() => {
              const msg = passwordError(password);
              setFieldErrors((prev) => {
                const next = { ...prev };
                if (msg) next.password = msg;
                else delete next.password;
                return next;
              });
            }}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? "password-err" : "password-hint"}
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
        ) : (
          <p id="password-hint" className="text-xs text-ink-muted">
            At least 8 characters.
          </p>
        )}
      </div>

      {error && (
        <p
          id={formErrorId}
          role="alert"
          className="rounded-[var(--radius-control)] border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="plate h-11 w-full rounded-full text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
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
