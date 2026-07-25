"use client";

import { CategoryIcon } from "@/src/shared/components/category-icon";
import { formatCurrency } from "@/src/shared/lib/format";
import type { CategorySummary, Currency } from "@/src/types/transaction";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";

interface CategoryOrbitProps {
  categories: CategorySummary[];
  currency: Currency;
  /** Controlled selection — pass the id that should sit on the center platform. */
  selectedId?: string | null;
  /** Fired whenever the center changes (satellite tap OR an external pick,
   *  e.g. a row tap in CategoryList). Wire to the same state as CategoryList
   *  so the orbit and the list never disagree about "what's selected". */
  onSelectChange?: (id: string) => void;
}

/**
 * Glass orbit — monochrome satellite/hub orbs (`.glass-orb` / `.glass-orb--hub`
 * from globals.css), with EXACTLY one accent: every icon glyph renders in
 * `--primary` blue. Nothing gets a solid colored fill behind it — including
 * the hub — so there's no "the center one gets a special blue chip and the
 * rest don't" inconsistency.
 *
 * Geometry: the path is a wide, TALL oval (RY > RX) rather than a tight
 * circle, and the hub + satellites are both smaller than before. On a
 * ~380–420px phone width the old circle packed 8 satellites so tightly that
 * neighboring icons AND their labels overlapped (confirmed in the reference
 * screenshots). The worst-case gap between any two neighboring satellites,
 * at any rotation angle, is governed by 2 · min(RX, RY) · sin(22.5°) — so
 * both radii are sized well past that threshold for a 4-line label at this
 * font size, not just "looks fine in one static frame."
 */

const spring = { type: "spring" as const, stiffness: 190, damping: 24 };

const ASPECT = "10 / 14.5";    // taller container — this is the "pull the path down / oval" fix
const CENTER_Y_FRAC = 0.44;    // pushed down from 0.40 — gives the TOP satellite real clearance instead of hugging the edge
const RX_FRAC = 0.40;          // fraction of WIDTH
const RY_FRAC = 0.34;          // fraction of HEIGHT (independent of width — true ellipse, not a scaled circle)
const HUB_SIZE = 128;          // px — was 172; the "big bubble" the ask was to shrink
const SATELLITE_SIZE = 46;     // px — was 54
const BASE_SPEED = 0.08;       // rad/s, slightly slower now that spacing is tighter to the eye

export const CategoryOrbit = memo(function CategoryOrbit({
  categories,
  currency,
  selectedId,
  onSelectChange,
}: CategoryOrbitProps) {
  const reduced = useReducedMotion();
  const sorted = [...categories].sort((a, b) => b.amount - a.amount);

  const [arrangement, setArrangement] = useState<string[]>(() => sorted.map((c) => c.id));

  useEffect(() => {
    setArrangement((prev) => {
      const validIds = new Set(sorted.map((c) => c.id));
      const kept = prev.filter((id) => validIds.has(id));
      const missing = sorted.map((c) => c.id).filter((id) => !kept.includes(id));
      const next = [...kept, ...missing];
      return next.length > 0 ? next : sorted.map((c) => c.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const byId = new Map(sorted.map((c) => [c.id, c]));

  // Sync FROM outside (e.g. a CategoryList row tap) → bring that id to center.
  useEffect(() => {
    if (!selectedId) return;
    setArrangement((prev) => {
      const i = prev.indexOf(selectedId);
      if (i <= 0) return prev;
      const next = [...prev];
      [next[0], next[i]] = [next[i], next[0]];
      return next;
    });
  }, [selectedId]);

  // Notify OUT whenever the center changes, including the initial default,
  // so anything else on the page can reflect the same selection.
  const lastNotified = useRef<string | null>(null);
  useEffect(() => {
    const centerId = arrangement[0];
    if (centerId && centerId !== lastNotified.current) {
      lastNotified.current = centerId;
      onSelectChange?.(centerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrangement]);

  const center = byId.get(arrangement[0]) ?? sorted[0];
  const satellites = arrangement
    .slice(1, 13)
    .map((id) => byId.get(id))
    .filter(Boolean) as CategorySummary[];

  const containerRef = useRef<HTMLDivElement>(null);
  const satRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const angleRef = useRef(-Math.PI / 2); // start at true top
  const speedRef = useRef(1);
  const hoveringRef = useRef(false);
  const isActiveRef = useRef(true);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (!isActiveRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const targetSpeed = hoveringRef.current ? 0.14 : 1;
      speedRef.current += (targetSpeed - speedRef.current) * Math.min(dt * 4, 1);
      angleRef.current += dt * BASE_SPEED * speedRef.current;

      const el = containerRef.current;
      if (!el) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const w = el.clientWidth;
      const h = el.clientHeight;
      const rx = RX_FRAC * w;
      const ry = RY_FRAC * h;
      const n = satRefs.current.length;
      const t = now / 1000;

      for (let i = 0; i < n; i++) {
        const node = satRefs.current[i];
        if (!node) continue;
        const a = angleRef.current + (i * Math.PI * 2) / n;
        const sin = Math.sin(a);
        const depth = (sin + 1) / 2; // 0 = rear/top, 1 = front/bottom
        const bob = Math.sin(t * 0.9 + i * 1.7) * 2;
        const x = w / 2 + Math.cos(a) * rx;
        const y = h * CENTER_Y_FRAC + sin * ry + bob;
        const scale = 0.86 + depth * 0.18;
        node.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
        node.style.opacity = "1";
        node.style.zIndex = depth > 0.55 ? "30" : "5";
        const label = labelRefs.current[i];
        if (label) label.style.opacity = "1";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, satellites.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isActiveRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      isActiveRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const parallaxX = useSpring(0, { stiffness: 60, damping: 18 });
  const parallaxY = useSpring(0, { stiffness: 60, damping: 18 });

  function promote(id: string) {
    setArrangement((prev) => {
      const i = prev.indexOf(id);
      if (i <= 0) return prev;
      const next = [...prev];
      [next[0], next[i]] = [next[i], next[0]];
      return next;
    });
  }

  if (!center) {
    return (
      <div className="glass-card flex flex-col items-center gap-2 rounded-[var(--radius)] p-8 text-center">
        <p className="text-sm font-semibold">No categories yet</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Add a transaction and its category will appear on the orbit.
        </p>
      </div>
    );
  }

  const frozen = satellites.map((_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / satellites.length;
    const depth = (Math.sin(a) + 1) / 2;
    return {
      left: `${50 + Math.cos(a) * RX_FRAC * 100}%`,
      top: `${(CENTER_Y_FRAC + Math.sin(a) * RY_FRAC) * 100}%`,
      depth,
    };
  });

  return (
    <div
      ref={containerRef}
      className="relative mx-auto mb-6 mt-3 w-full max-w-full overflow-visible"
      style={{ aspectRatio: ASPECT }}
      onPointerEnter={() => (hoveringRef.current = true)}
      onPointerLeave={() => {
        hoveringRef.current = false;
        parallaxX.set(0);
        parallaxY.set(0);
      }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        parallaxX.set(((e.clientX - rect.left) / rect.width - 0.5) * 10);
        parallaxY.set(((e.clientY - rect.top) / rect.height - 0.5) * 8);
      }}
    >
      <motion.div className="absolute inset-0" style={{ x: parallaxX, y: parallaxY }}>
        {/* Plain dashed hairline guide — no colored glow at rest. */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            top: `${CENTER_Y_FRAC * 100}%`,
            width: `${RX_FRAC * 200}%`,
            aspectRatio: `${RX_FRAC} / ${RY_FRAC}`,
            border: "1px dashed var(--border-strong)",
          }}
        />

        {/* ============ CENTER — smaller glass hub, blue ring, blue icon (no fill chip) ============ */}
        <div
          className="absolute left-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${CENTER_Y_FRAC * 100}%` }}
        >
          <motion.div
            key={center.id}
            layoutId={`orbit-${center.id}`}
            transition={spring}
            className="glass-orb glass-orb--hub relative flex flex-col items-center justify-center gap-0.5 rounded-full"
            style={{ width: HUB_SIZE, height: HUB_SIZE }}
          >
            <motion.span
              animate={reduced ? undefined : { y: [0, -2, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex items-center justify-center"
              style={{ color: "var(--primary)" }}
            >
              <CategoryIcon name={center.icon} className="size-6" />
            </motion.span>
            <span className="relative text-[13px] font-bold text-[var(--foreground)]">{center.name}</span>
            <span className="relative text-[17px] font-extrabold tabular-nums text-[var(--foreground)]">
              {formatCurrency(center.amount, currency)}
            </span>
            <span className="relative text-xs font-bold" style={{ color: "var(--primary)" }}>
              {center.percent}%
            </span>
          </motion.div>
        </div>

        {/* ============ SATELLITES — same glass-orb, blue icon, no fill chip ============ */}
        {satellites.map((cat, i) => {
          const slot = frozen[i];
          const isSelected = cat.id === selectedId;
          return (
            <div
              key={cat.id}
              ref={(el) => {
                satRefs.current[i] = el;
              }}
              className="absolute left-0 top-0 flex w-[70px] flex-col items-center"
              style={
                reduced
                  ? {
                    left: slot.left,
                    top: slot.top,
                    transform: `translate(-50%, -50%) scale(${0.86 + slot.depth * 0.18})`,
                    opacity: 0.75 + slot.depth * 0.25,
                    zIndex: slot.depth > 0.55 ? 30 : 5,
                  }
                  : { transform: "translate(-50%, -50%)", opacity: 0 }
              }
            >
              <motion.button
                layoutId={`orbit-${cat.id}`}
                transition={spring}
                type="button"
                onClick={() => {
                  promote(cat.id);
                  onSelectChange?.(cat.id);
                }}
                aria-label={`Select ${cat.name}: ${formatCurrency(cat.amount, currency)}, ${cat.percent}% of total`}
                className="glass-orb flex shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-ring"
                style={{
                  width: SATELLITE_SIZE,
                  height: SATELLITE_SIZE,
                  color: "var(--primary)",
                  borderColor: isSelected ? "var(--primary)" : undefined,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
              >
                <CategoryIcon name={cat.icon} className="size-4.5" />
              </motion.button>
              <div
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                className="pointer-events-none mt-1 flex w-full flex-col items-center leading-tight transition-opacity duration-300"
                style={reduced ? { opacity: 0.7 + slot.depth * 0.3 } : { opacity: 0 }}
              >
                <p className="w-full truncate text-center text-[10.5px] font-bold text-[var(--foreground)]">
                  {cat.name}
                </p>
                <p className="w-full truncate text-center text-[10px] font-semibold tabular-nums text-[var(--muted-foreground)]">
                  {formatCurrency(cat.amount, currency)}
                </p>
                <p className="w-full text-center text-[9.5px] font-semibold text-[var(--muted-foreground)]">
                  {cat.percent}%
                </p>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
});