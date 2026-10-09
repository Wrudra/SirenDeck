"use client";

import { useEffect, useMemo, useState } from "react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";

import { URGENCY_INK, URGENCY_WASH } from "@/components/money-map/tile";
import { deadlineWeight } from "@/lib/map/deadline-weight";
import { layoutFlat } from "@/lib/map/treemap";
import { getUrgency, type UrgencyLevel } from "@/lib/urgency";

/**
 * Sample map for the landing page. Same layout math and the same washed
 * cards as the Money Map. A clock advances the dates so the cards rerank.
 */

interface DemoItem {
  id: string;
  title: string;
  cost: number;
  daysLeft: number;
}

const INITIAL: DemoItem[] = [
  { id: "ins", title: "Car insurance", cost: 45000, daysLeft: 42 },
  { id: "pass", title: "Passport", cost: 8500, daysLeft: 58 },
  { id: "elec", title: "Electricity", cost: 42000, daysLeft: 16 },
  { id: "dom", title: "sirendeck.app", cost: 2200, daysLeft: 9 },
  { id: "net", title: "Netflix", cost: 14400, daysLeft: 6 },
  { id: "spot", title: "Spotify", cost: 7200, daysLeft: 2 },
  { id: "lic", title: "Driving license", cost: 1200, daysLeft: 96 },
];

const RANK_SPRING = { type: "spring", bounce: 0, duration: 0.35 } as const;
/** One demo-day per step. Fast enough that the map is always moving. */
const STEP_MS = 280;
/** Walk every item through due and a little past due, then start again. */
const CYCLE = 110;

function fmtBDT(n: number): string {
  return `৳${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
}

function urgencyOf(daysLeft: number): UrgencyLevel {
  return getUrgency(
    new Date(Date.now() + daysLeft * 86_400_000).toISOString().slice(0, 10),
  ).level;
}

function daysWord(d: number): string {
  if (d < 0) return `${Math.abs(d)}d over`;
  if (d === 0) return "today";
  return `${d}d`;
}

export function DepartureBoard() {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setTick((n) => (n + 1) % CYCLE), STEP_MS);
    return () => window.clearInterval(t);
  }, [reduced]);

  const items = useMemo(() => {
    const burn = tick;
    return INITIAL.map((item) => ({
      ...item,
      daysLeft: item.daysLeft - burn,
    })).map((item) => ({
      ...item,
      urgency: urgencyOf(item.daysLeft),
    }));
  }, [tick]);

  const ranked = useMemo(
    () => [...items].sort((a, b) => a.daysLeft - b.daysLeft),
    [items],
  );

  const rects = useMemo(() => {
    const inputs = items.map((i) => ({ id: i.id, value: deadlineWeight(i.daysLeft) }));
    const laid = layoutFlat(inputs, 720, 300, 12);
    const byId = new Map(laid.map((r) => [r.id, r]));
    // scale from the 720×300 design frame to percentage space
    return items.map((i) => {
      const r = byId.get(i.id);
      return r
        ? {
            ...i,
            left: (r.x / 720) * 100,
            top: (r.y / 300) * 100,
            width: (r.width / 720) * 100,
            height: (r.height / 300) * 100,
          }
        : null;
    });
  }, [items]);

  return (
    <MotionConfig reducedMotion="user">
      <div>
        <p className="mb-3 text-sm text-ink-muted">Sample</p>
        <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr]">
          <div aria-hidden className="relative aspect-[12/5] min-h-56">
            {rects.map(
              (r) =>
                r && (
                  <motion.div
                    key={r.id}
                    layout={!reduced}
                    className="absolute flex flex-col justify-start overflow-hidden rounded-2xl p-3 text-left"
                    style={{
                      left: `${r.left}%`,
                      top: `${r.top}%`,
                      width: `${r.width}%`,
                      height: `${r.height}%`,
                      background: URGENCY_WASH[r.urgency],
                    }}
                    transition={RANK_SPRING}
                  >
                    {r.width > 16 && r.height > 28 && (
                      <p className="truncate text-[13px] leading-tight font-semibold tracking-[-0.02em] text-ink">
                        {r.title}
                      </p>
                    )}
                    {r.width > 12 && r.height > 22 && (
                      <p
                        className="tabular text-sm font-semibold tracking-[-0.03em]"
                        style={{ color: URGENCY_INK[r.urgency] }}
                      >
                        {daysWord(r.daysLeft)}
                      </p>
                    )}
                  </motion.div>
                ),
            )}
          </div>

          <ul aria-hidden className="flex flex-col justify-center gap-1">
            {ranked.map((item) => (
              <motion.li
                key={item.id}
                layout={!reduced}
                transition={RANK_SPRING}
                className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 px-1 py-1.5"
              >
                <span className="truncate text-sm text-ink">{item.title}</span>
                <span className="tabular text-sm font-semibold" style={{ color: URGENCY_INK[item.urgency] }}>
                  {daysWord(item.daysLeft)}
                </span>
                <span className="tabular w-12 text-right text-sm text-ink-muted">{fmtBDT(item.cost)}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </MotionConfig>
  );
}
