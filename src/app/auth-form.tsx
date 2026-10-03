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
    // final client-side gate; server still validates
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
    "w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-[#8b94a7]/60 focus-visible:ring-2";

  if (awaitingConfirmation) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#11161f] p-6 text-center">
        <p className="text-sm leading-relaxed text-[#8b94a7]" style={{ textWrap: "pretty" }}>
          We sent a confirmation link to <span className="font-medium text-[#e8ecf4]">{email}</span>.
          Click it to activate your account, then sign in here.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">
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
          className={`${inputBase} ${fieldErrors.email ? "border-[#dc2626] focus-visible:ring-[#dc2626]/40" : "border-white/15 focus-visible:border-[#4cc2ff] focus-visible:ring-[#4cc2ff]/30"}`}
        />
        {fieldErrors.email && (
          <p id="email-err" className="text-xs text-[#dc2626]">{fieldErrors.email}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
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
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => onBlur("password", password)}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? "password-err" : "password-hint"}
            placeholder="At least 8 characters"
            className={`${inputBase} pr-10 ${fieldErrors.password ? "border-[#dc2626] focus-visible:ring-[#dc2626]/40" : "border-white/15 focus-visible:border-[#4cc2ff] focus-visible:ring-[#4cc2ff]/30"}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8b94a7] transition-colors hover:text-[#e8ecf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4cc2ff]"
          >
            {showPassword ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
          </button>
        </div>
        {fieldErrors.password ? (
          <p id="password-err" className="text-xs text-[#dc2626]">{fieldErrors.password}</p>
        ) : (
          <p id="password-hint" className="text-xs text-[#8b94a7]">
            {mode === "signup" ? "At least 8 characters." : "\u00A0"}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-[#dc2626]/30 bg-[#dc2626]/10 px-3 py-2 text-xs text-[#f87171]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#4cc2ff] px-3 py-2.5 text-base font-semibold text-[#0a0e14] transition-transform duration-300 ease-[var(--ease-fluid)] hover:scale-[1.01] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc2ff] disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
