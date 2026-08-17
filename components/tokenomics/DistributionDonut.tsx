"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { UMBRA } from "@/app/content";
import styles from "./tokenomics.module.css";

/**
 * Distribution — the pinned cinematic centerpiece. A hand-built SVG donut
 * (no chart library) scrubbed through UMBRA.tokenomics.distribution's 3
 * categories with a dwell-then-transition focus, mirroring RoadmapTeaser's
 * "Descent to Totality" pin/scrub pattern (local N=3 copy of its
 * focusFromProgress math — 2D opacity/blur/translateY instead of 3D depth,
 * since a flat ring has no z-stage). Reduced motion / narrow viewports keep
 * the static default: full ring, all segments visible, legend list shown,
 * no ScrollTrigger created at all.
 */

const R = 80;
const STROKE = 20;
const CIRC = 2 * Math.PI * R;
const COLORS = ["var(--corona)", "var(--ember)", "var(--ember-deep)"];

const DIST = UMBRA.tokenomics.distribution;
const N = DIST.length;
const HOLD_W = 2;
const TRANS_W = 1;
const TOTAL_UNITS = N * HOLD_W + (N - 1) * TRANS_W;

function focusFromProgress(p: number): number {
  const seg = Math.max(0, Math.min(1, p)) * TOTAL_UNITS;
  let acc = 0;
  for (let k = 0; k < N; k++) {
    if (seg <= acc + HOLD_W) return k;
    acc += HOLD_W;
    if (k < N - 1) {
      if (seg <= acc + TRANS_W) {
        const tt = (seg - acc) / TRANS_W;
        return k + tt * tt * (3 - 2 * tt); // smoothstep k → k+1
      }
      acc += TRANS_W;
    }
  }
  return N - 1;
}

let cumulative = 0;
const SEGMENTS = DIST.map((d, i) => {
  const frac = d.pct / 100;
  const dash = frac * CIRC;
  const offset = -cumulative * CIRC;
  cumulative += frac;
  return { ...d, dash, offset, color: COLORS[i % COLORS.length] };
});

export default function DistributionDonut() {
  const stageRef = useRef<HTMLDivElement>(null);
  const arcRefs = useRef<(SVGCircleElement | null)[]>([]);
  const readoutRefs = useRef<(HTMLDivElement | null)[]>([]);
  const legendRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Reduced motion or narrow viewports: keep the static full-ring + legend.
    if (reduce || window.innerWidth < 720) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      stage.dataset.mode = "active";

      const render = (p: number) => {
        const focus = focusFromProgress(p);
        SEGMENTS.forEach((_, i) => {
          const d = i - focus;
          const arc = arcRefs.current[i];
          if (arc) {
            gsap.set(arc, {
              opacity: Math.max(0.16, 1 - Math.abs(d) * 1.1),
              filter:
                Math.round(focus) === i
                  ? "drop-shadow(0 0 8px var(--corona))"
                  : "none",
            });
          }
          const readout = readoutRefs.current[i];
          if (readout) {
            const o = Math.max(0, Math.min(1, 1 - Math.abs(d) * 1.1));
            gsap.set(readout, {
              opacity: o,
              y: d * 18,
              filter:
                Math.abs(d) > 0.05
                  ? `blur(${Math.min(4, Math.abs(d) * 3.5).toFixed(2)}px)`
                  : "none",
            });
          }
          const legend = legendRefs.current[i];
          if (legend) {
            gsap.set(legend, {
              opacity: Math.round(focus) === i ? 1 : 0.4,
            });
          }
        });
      };

      ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: "+=250%",
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
  }, []);

  return (
    <section id="tokenomics-breakdown" className={styles.section}>
      <div className="u-container">
        <div className={styles.marker}>
          <span className={styles.markerLabel}>Distribution</span>
          <span className={styles.markerCaption}>
            {UMBRA.tokenomics.supply} {UMBRA.ticker}
          </span>
        </div>
      </div>

      <div ref={stageRef} className={styles.stage} data-mode="static">
        <div className={styles.donutWrap}>
          <svg viewBox="0 0 200 200" className={styles.donut} aria-hidden="true">
            <g transform="rotate(-90 100 100)">
              {SEGMENTS.map((seg, i) => (
                <circle
                  key={seg.label}
                  ref={(el) => {
                    arcRefs.current[i] = el;
                  }}
                  cx={100}
                  cy={100}
                  r={R}
                  strokeWidth={STROKE}
                  fill="none"
                  stroke={seg.color}
                  strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
                  strokeDashoffset={seg.offset}
                />
              ))}
            </g>
          </svg>

          <div className={styles.readoutStack}>
            {SEGMENTS.map((seg, i) => (
              <div
                key={seg.label}
                ref={(el) => {
                  readoutRefs.current[i] = el;
                }}
                className={styles.readout}
              >
                <div className={styles.readoutPct}>{seg.pct}%</div>
                <div className={styles.readoutLabel}>{seg.label}</div>
              </div>
            ))}
          </div>
        </div>

        <ul className={styles.legend}>
          {SEGMENTS.map((seg, i) => (
            <li
              key={seg.label}
              ref={(el) => {
                legendRefs.current[i] = el;
              }}
              className={styles.legendRow}
            >
              <span className={styles.swatch} style={{ background: seg.color }} />
              <span className={styles.legendLabel}>{seg.label}</span>
              <span className={`${styles.legendPct} u-tabular`}>{seg.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
