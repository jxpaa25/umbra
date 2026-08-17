"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Shared "descend through N stacked plates" pin+scrub effect (Roadmap and
 * Tokenomics both use it): each plate holds in focus, then quickly depth-
 * shifts to the next, while `stageRef`'s box stays pinned to the viewport for
 * the whole pass — so a header/footer pinned alongside it (via CSS, see
 * `.stageHeader`/`.stageFooter` in sections.module.css) stays on screen too.
 * Bails to the static stacked-list markup under reduced motion or narrow
 * viewports (the caller's JSX is the fallback, styled by `[data-mode="static"]`).
 */
/* ---- dramatic deep-space-zoom tuning (shared by both sections) ------------ */
// Ahead plates sit DEEP (small, blurred); the focused one is razor-sharp dead-centre;
// passed plates loom toward the camera (bigger, re-blurred, fading) — but capped below
// the CSS perspective (900px) so they never cross it (which would flip/singularity).
const SPACING_BACK = 1000; // px translateZ per depth step for plates still AHEAD (d>0)
const SPACING_FRONT = 340; // px translateZ per step for plates already PASSED (d<0)
const Z_FRONT_MAX = 540; // clamp toward-camera Z (< perspective) — no scale singularity
const Y_STEP = 16; // px translateY per step — a hint of parallax; mostly a pure zoom
const BLUR_STEP = 16; // px blur per depth step
const BLUR_MAX = 28; // px blur cap
const VIS_SPAN = 1.2; // |d| beyond which a plate is ~invisible
const OPAC_POW = 2.0; // higher ⇒ plates emerge later, from near-nothing
const PUNCH = 0.06; // scale "pop" at focus (the slight landing overshoot)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function usePinnedDepthStage(
  stageRef: RefObject<HTMLDivElement | null>,
  itemSelector: string,
  { holdWidth = 2, transWidth = 1 } = {},
) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || window.innerWidth < 720) return;

    gsap.registerPlugin(ScrollTrigger);

    const items = Array.from(
      stage.querySelectorAll<HTMLElement>(itemSelector),
    );
    const n = items.length;
    const totalUnits = n * holdWidth + (n - 1) * transWidth;

    // Map scroll progress → focus index with a dwell on each plate then a
    // quick transition, so the content never bleeds into the next too early.
    function focusFromProgress(p: number): number {
      const seg = Math.max(0, Math.min(1, p)) * totalUnits;
      let acc = 0;
      for (let k = 0; k < n; k++) {
        if (seg <= acc + holdWidth) return k;
        acc += holdWidth;
        if (k < n - 1) {
          if (seg <= acc + transWidth) {
            const tt = (seg - acc) / transWidth;
            return k + tt * tt * (3 - 2 * tt); // smoothstep k → k+1
          }
          acc += transWidth;
        }
      }
      return n - 1;
    }

    const ctx = gsap.context(() => {
      stage.dataset.mode = "active";

      gsap.set(items, { xPercent: -50, yPercent: -50 });

      const render = (p: number) => {
        const focus = focusFromProgress(p);
        items.forEach((el, i) => {
          const d = i - focus; // 0 = in focus, >0 ahead (deep), <0 passed
          const ad = Math.abs(d);
          // emerge-from-near-nothing opacity (steep power falloff)
          const o = clamp01(1 - ad / VIS_SPAN) ** OPAC_POW;
          if (o < 0.02) {
            // effectively invisible — drop opacity AND the heavy blur filter so we don't
            // pay compositor cost on plates nobody can see (bounds filtered elements)
            gsap.set(el, {
              opacity: 0,
              filter: "none",
              zIndex: 100 - Math.round(ad * 10),
            });
            return;
          }
          // asymmetric depth: deep when ahead, loom toward the camera (capped) when passed
          const z =
            d > 0
              ? -d * SPACING_BACK
              : Math.min(Z_FRONT_MAX, -d * SPACING_FRONT);
          const blur = Math.min(BLUR_MAX, ad * BLUR_STEP);
          // subtle scale "pop" at focus (d≈0) — the slight landing overshoot
          const punch = clamp01(1 - ad / 0.5) ** 2;
          gsap.set(el, {
            z,
            y: d * Y_STEP,
            scale: 1 + PUNCH * punch,
            opacity: o,
            filter: `blur(${blur.toFixed(2)}px)`,
            zIndex: 100 - Math.round(ad * 10),
          });
        });
      };

      ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: "+=300%",
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => render(self.progress),
      });

      render(0);
    }, stage);

    return () => {
      ctx.revert();
      stage.dataset.mode = "static";
    };
  }, [stageRef, itemSelector, holdWidth, transWidth]);
}
