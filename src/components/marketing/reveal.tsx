"use client";

import { useEffect, useRef } from "react";

import { cn } from "cn";

/**
 * Scroll interpolation wrapper (elayadesign B7): children resolve from
 * translate-y-16 blur-md opacity-0 into place over 700ms+ with the fluid
 * easing when entering the viewport. IntersectionObserver driven, DOM-class
 * sync only (no state), and fully bypassed under reduced motion.
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
  id,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  id?: string;
  as?: "div" | "section" | "li" | "p" | "h2" | "h3";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => el.classList.add("reveal-in");

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      show();
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      show();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      id={id}
      className={cn("reveal-init", className)}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </Tag>
  );
}

/**
 * Tagline reveal (elayadesign B11): words start at ~30% text opacity and
 * activate one at a time in reading order as the section scrolls through.
 * Single rAF-throttled scroll listener, IntersectionObserver gated, DOM-only
 * updates. Reduced motion → words render at full opacity.
 */
export function TaglineReveal({
  lines,
  className,
}: {
  lines: string[];
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const words = Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      for (const w of words) w.style.color = "";
      return;
    }

    let raf = 0;
    let visible = false;

    const compute = () => {
      raf = 0;
      if (!visible) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // trigger sweeps from 85% → 35% of viewport height
      const t = Math.min(Math.max((vh * 0.85 - rect.top) / (vh * 0.5), 0), 1);
      const active = Math.round(t * words.length);
      for (let i = 0; i < words.length; i++) {
        words[i].style.color = i < active ? "" : "color-mix(in oklab, currentColor 30%, transparent)";
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) onScroll();
      },
      { threshold: 0 },
    );
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    compute();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Word index computed without mutation during render (compiler-safe):
  // prefix counts give each word its absolute index across lines.
  const wordCounts = lines.map((line) => line.split(/\s+/).length);
  const starts = wordCounts.map((_, i) =>
    wordCounts.slice(0, i).reduce((a, b) => a + b, 0),
  );

  const linesRendered = lines.map((line, lineIdx) => (
    <span key={lineIdx} className="block">
      {line.split(/\s+/).map((word, i) => (
        <span key={`${word}-${starts[lineIdx] + i}`} data-word>
          {word}{" "}
        </span>
      ))}
    </span>
  ));

  return (
    <p ref={ref} className={cn("text-balance", className)}>
      {linesRendered}
    </p>
  );
}
