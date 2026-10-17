"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { turnstileSiteKey } from "@/lib/auth/turnstile";

type Mode = "login" | "signup";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

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
  const [notice, setNotice] = useState<"email-sent" | "signed-in" | "no-email" | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = turnstileSiteKey();

  function resetTurnstile() {
    setTurnstileToken(null);
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }

  function mountTurnstile() {
    if (!siteKey || !turnstileRef.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: siteKey,
      theme: "light",
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(null),
      "error-callback": () => setTurnstileToken(null),
    });
  }

  useEffect(() => {
    mountTurnstile();
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
    // The widget mounts once the script is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  function emailError(value: string): string | null {
    if (value === "") return "Enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Email address must include @ and a domain.";
    }
    return null;
  }

  function passwordError(value: string): string | null {
    if (value === "") return "Enter your password.";
    if (mode !== "signup") return null;
    if (value.length < 10) return "Use at least 10 characters.";
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
      status?: "email-sent" | "signed-in" | "no-email";
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
    if (!siteKey) errs.turnstile = "Sign-in is not configured.";
    else if (!turnstileToken) errs.turnstile = "Confirm you are human, then try again.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      document.getElementById(errs.email ? "email" : "password")?.focus();
      return;
    }
    setPending(true);
    setError(null);
    try {
      const data = await post(mode === "signup" ? "signup" : "login", {
        email,
        password,
        turnstileToken: turnstileToken ?? "",
      });
      if (
        mode === "signup" &&
        (data.status === "email-sent" || data.status === "no-email" || data.status === "signed-in")
      ) {
        setNotice(data.status);
        return;
      }
      router.replace("/app");
      router.refresh();
    } catch (err) {
      resetTurnstile();
      setError(err instanceof Error ? err.message : "Connection failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (notice) {
    const sent = notice === "email-sent";
    const ready = notice === "signed-in";
    return (
      <div role="status" className="flex w-full flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-[-0.03em]">
          {sent ? "Check your email" : ready ? "Account created" : "No email was sent"}
        </h2>
        <p className="text-sm leading-relaxed text-ink" style={{ textWrap: "pretty" }}>
          {sent ? (
            <>
              We sent a confirmation link to <span className="font-medium">{email}</span>. Open it,
              then sign in.
            </>
          ) : ready ? (
            "Your account is ready. No confirmation email was needed."
          ) : (
            <>
              Nothing was sent to <span className="font-medium">{email}</span>. If you already have
              an account, sign in.
            </>
          )}
        </p>
        {sent && (
          <p className="text-sm text-ink-muted">Nothing arrived? Check spam, then try signing in.</p>
        )}
        {ready ? (
          <button
            type="button"
            onClick={() => {
              router.replace("/app");
              router.refresh();
            }}
            className="plate h-11 w-full rounded-full text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Open your map
          </button>
        ) : (
          <Link
            href="/login"
            className="plate inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Sign in
          </Link>
        )}
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
            minLength={mode === "signup" ? 10 : undefined}
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
            aria-describedby={
              fieldErrors.password ? "password-err" : mode === "signup" ? "password-hint" : undefined
            }
            placeholder={mode === "signup" ? "At least 10 characters" : "Password"}
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
            At least 10 characters.
          </p>
        ) : null}
      </div>

      {siteKey ? (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onLoad={mountTurnstile}
          />
          <div ref={turnstileRef} />
        </>
      ) : null}
      {fieldErrors.turnstile && (
        <p className="text-xs text-ink">{fieldErrors.turnstile}</p>
      )}

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
        disabled={pending || !turnstileToken}
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
