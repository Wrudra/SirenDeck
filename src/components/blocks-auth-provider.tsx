"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { fetchSessionClaims, logout as blocksLogout, startLogin, type SessionClaims } from "@/lib/blocks/auth";
import { isBlocksLoginConfigured } from "@/lib/blocks/config";

type Status = "loading" | "authenticated" | "unauthenticated";

type BlocksAuthContextValue = {
  status: Status;
  claims: SessionClaims;
  configured: boolean;
  login: (returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const BlocksAuthContext = createContext<BlocksAuthContextValue | null>(null);

const STATUS_POLL_MS = 5 * 60 * 1000;

export function BlocksAuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isBlocksLoginConfigured();
  const [status, setStatus] = useState<Status>(configured ? "loading" : "unauthenticated");
  const [claims, setClaims] = useState<SessionClaims>(null);

  const refresh = useCallback(async () => {
    if (!configured) {
      setStatus("unauthenticated");
      setClaims(null);
      return;
    }
    try {
      // userInfo can hang on cold cookie miss; bound wait so login CTA is usable
      const next = await Promise.race([
        fetchSessionClaims(),
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 8000)),
      ]);
      if (next) {
        setClaims(next);
        setStatus("authenticated");
      } else {
        setClaims(null);
        setStatus("unauthenticated");
      }
    } catch {
      setClaims(null);
      setStatus("unauthenticated");
    }
  }, [configured]);

  useEffect(() => {
    void refresh();
    if (!configured) return;
    const id = window.setInterval(() => void refresh(), STATUS_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [configured, refresh]);

  const value = useMemo<BlocksAuthContextValue>(
    () => ({
      status,
      claims,
      configured,
      login: (returnTo = "/app") => startLogin(returnTo),
      logout: async () => {
        await blocksLogout();
        setClaims(null);
        setStatus("unauthenticated");
      },
      refresh,
    }),
    [status, claims, configured, refresh],
  );

  return <BlocksAuthContext.Provider value={value}>{children}</BlocksAuthContext.Provider>;
}

export function useBlocksAuth(): BlocksAuthContextValue {
  const ctx = useContext(BlocksAuthContext);
  if (!ctx) {
    throw new Error("useBlocksAuth must be used within BlocksAuthProvider");
  }
  return ctx;
}
