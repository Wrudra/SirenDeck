"use client";

import { useEffect, useMemo, useState } from "react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";

import { deadlineWeight } from "@/lib/map/deadline-weight";
import { layoutFlat } from "@/lib/map/treemap";
import { getUrgency, type UrgencyLevel } from "@/lib/urgency";

/**
 * Synthetic demo board for the landing hero. Real layout math (d3-hierarchy),
 * fake data, a clock that advances every few seconds: shades deepen along the
 * five-step ink ramp and rows rerank in place. Labeled synthetic · the
 * mechanism demonstrated, not described.
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

const RANK_SPRING = { type: "spring", stiffness: 320, damping: 34 } as const;

function fmtBDT(n: number): string {
  return `৳${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
}

function urgencyOf(daysLeft: number): UrgencyLevel {
  return getUrgency(
    new Date(Date.now() + daysLeft * 86_400_000).toISOString().slice(0, 10),
  ).level;
}

/** Heatmap shade per urgency · matches the Money Map surface. */
const SHADE: Record<UrgencyLevel, string> = {
  calm: "var(--heat-calm)",
  soon: "var(--heat-soon)",
  urgent: "var(--heat-urgent)",
  critical: "var(--heat-critical)",
  overdue: "var(--heat-overdue)",
};

/** White text on every urgency · TradingView-style heatmap. */
const SHADE_TEXT: Record<UrgencyLevel, string> = {
  calm: "var(--heat-ink)",
  soon: "var(--heat-ink)",
  urgent: "var(--heat-ink)",
  critical: "var(--heat-ink)",
  overdue: "var(--heat-ink)",
};

/** Small chips beside rows: text-safe twins. */
const TEXT_TONE: Record<UrgencyLevel, string> = {
  calm: "var(--heat-calm)",
  soon: "var(--heat-soon)",
  urgent: "var(--heat-urgent)",
  critical: "var(--heat-critical)",
  overdue: "var(--heat-overdue)",
};

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
    const t = setInterval(() => setTick((n) => n + 1), 2600);
    return () => clearInterval(t);
  }, [reduced]);

  const items = useMemo(() => {
    // one day burns per ~2.6s tick; the clock never resets. Slow enough that
    // the rerank reads as a living ledger, not a countdown alarm.
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
    const laid = layoutFlat(inputs, 720, 300, 2);
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
      <div className="overflow-hidden border border-rule bg-heat-bg">
        {/* heatmap header rail */}
        <div className="flex items-center justify-between border-b border-heat-rule px-4 py-2.5">
          <p className="ledger-cap text-[10px] text-white/55">
            Entries: renewals &amp; expiries
          </p>
          <p className="ledger-cap text-[10px] text-white/55">Synthetic</p>
        </div>

        <div className="grid md:grid-cols-[3fr_2fr]">
          {/* the map: sized by deadline, shaded by urgency */}
          <div
            aria-hidden
            className="relative aspect-[12/5] gap-px bg-heat-rule p-px md:border-r md:border-heat-rule"
          >
            <div className="relative h-full w-full">
              {rects.map(
                (r) =>
                  r && (
                    <motion.div
                      key={r.id}
                      layout={!reduced}
                      className="absolute p-1.5"
                      style={{
                        left: `${r.left}%`,
                        top: `${r.top}%`,
                        width: `calc(${r.width}% - 1px)`,
                        height: `calc(${r.height}% - 1px)`,
                        backgroundColor: SHADE[r.urgency],
                        color: SHADE_TEXT[r.urgency],
                      }}
                      transition={RANK_SPRING}
                    >
                      {r.width > 14 && r.height > 30 && (
                        <>
                          <p className="truncate text-[11px] leading-tight font-semibold">{r.title}</p>
                          <p
                            className="tabular absolute right-1.5 bottom-1 text-[10px] opacity-80"
                            style={{ fontFamily: "var(--font-mono-var)" }}
                          >
                            {fmtBDT(r.cost)}
                          </p>
                        </>
                      )}
                    </motion.div>
                  ),
              )}
            </div>
          </div>

          {/* the ranked rows: what leaves soonest, reranking in place */}
          <div aria-hidden className="flex flex-col justify-between gap-px bg-heat-rule p-px">
            {ranked.map((item) => (
              <motion.div
                key={item.id}
                layout={!reduced}
                transition={RANK_SPRING}
                className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 bg-heat-bg px-3 py-2"
              >
                <span className="truncate text-[13px] text-white/90">{item.title}</span>
                <span
                  className="tabular text-[12px] font-semibold"
                  style={{ color: TEXT_TONE[item.urgency], fontFamily: "var(--font-mono-var)" }}
                >
                  {daysWord(item.daysLeft)}
                </span>
                <span
                  className="tabular w-14 text-right text-[12px] text-white/55"
                  style={{ fontFamily: "var(--font-mono-var)" }}
                >
                  {fmtBDT(item.cost)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* heatmap footer: the reading key */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-heat-rule px-4 py-2">
          <span className="ledger-cap text-[9px] text-white/55">Tile size = how soon due</span>
          <span className="ledger-cap text-[9px] text-white/55">Color = urgency</span>
          <span className="ledger-cap ml-auto text-[9px] text-white/55">Rows rank by due date</span>
        </div>
      </div>
    </MotionConfig>
  );
}
