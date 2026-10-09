"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ListIcon, MapIcon } from "lucide-react";

import { cn } from "cn";

type AppView = "map" | "list";

const ViewContext = createContext<{
  active: AppView;
  explicit: boolean;
  go: (view: AppView) => void;
} | null>(null);

function useView() {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("View controls must sit inside ViewProvider");
  return ctx;
}

/**
 * Owns the Map/List choice. The click updates local state first, so the
 * canvas swaps before the URL round-trip finishes.
 */
export function ViewProvider({
  serverView,
  query,
  children,
}: {
  serverView: string | null;
  query: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const queryRef = useRef(query);
  queryRef.current = query;
  const [, startTransition] = useTransition();
  const [picked, setPicked] = useState<AppView | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    setReady(true);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (picked && serverView === picked) setPicked(null);
  }, [picked, serverView]);

  const fromServer: AppView =
    serverView === "list" ? "list" : serverView === "map" ? "map" : isMobile ? "list" : "map";
  const active = picked ?? fromServer;
  const explicit = serverView === "list" || serverView === "map" || picked != null || ready;

  const go = (view: AppView) => {
    if (view === active) return;
    setPicked(view);
    const qs = new URLSearchParams(queryRef.current);
    qs.set("view", view);
    startTransition(() => {
      router.replace(`/app?${qs.toString()}`, { scroll: false });
    });
  };

  return (
    <ViewContext.Provider value={{ active, explicit, go }}>{children}</ViewContext.Provider>
  );
}

/** Both views stay mounted. Switching only toggles which one is shown. */
export function ViewStage({ list, map }: { list: ReactNode; map: ReactNode }) {
  const { active, explicit } = useView();

  if (!explicit) {
    return (
      <>
        <div className="flex min-h-0 flex-1 flex-col md:hidden">{list}</div>
        <div className="hidden min-h-0 flex-1 flex-col md:flex">{map}</div>
      </>
    );
  }

  return (
    <>
      <div
        className={active === "list" ? "flex min-h-0 flex-1 flex-col" : "hidden"}
        inert={active === "list" ? undefined : true}
        aria-hidden={active === "list" ? undefined : true}
      >
        {list}
      </div>
      <div
        className={active === "map" ? "flex min-h-0 flex-1 flex-col" : "hidden"}
        inert={active === "map" ? undefined : true}
        aria-hidden={active === "map" ? undefined : true}
      >
        {map}
      </div>
    </>
  );
}

export function ViewTabs() {
  const { active, go } = useView();

  const button = (view: AppView, label: string, icon: ReactNode) => {
    const on = active === view;
    return (
      <button
        type="button"
        onClick={() => go(view)}
        aria-current={on ? "page" : undefined}
        className={cn(
          "relative z-10 inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium",
          "transition-colors duration-150 ease-[var(--ease-out)] active:scale-[0.97]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          on ? "text-bg" : "text-ink-muted hover:text-ink",
        )}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <nav
      aria-label="View"
      className="relative grid grid-cols-2 rounded-full bg-surface-2 p-0.5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-ink transition-transform duration-150 ease-[var(--ease-out)] motion-reduce:transition-none"
        style={{ transform: active === "list" ? "translateX(100%)" : "translateX(0)" }}
      />
      {button("map", "Map", <MapIcon className="size-3.5" aria-hidden />)}
      {button("list", "List", <ListIcon className="size-3.5" aria-hidden />)}
    </nav>
  );
}
