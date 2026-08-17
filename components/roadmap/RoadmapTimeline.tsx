"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { UMBRA } from "@/app/content";
import { useInView } from "../useInView";
import EclipseGlyph from "./EclipseGlyph";
import styles from "./roadmap.module.css";

type Phase = (typeof UMBRA.phases)[number];

/** One phase: eclipse glyph node on the spine (left rail) + content (right).
 *  Reveals once on scroll-in via useInView, exactly like Manifesto's line
 *  reveal. data-status drives node/pill color; milestone nodes carry real
 *  done/pending state (not decorative). */
function PhaseRow({ phase, index }: { phase: Phase; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>({
    threshold: 0.25,
    rootMargin: "0px 0px -10% 0px",
  });

  return (
    <div
      ref={ref}
      data-status={phase.status}
      className={`${styles.row} ${inView ? styles.rowIn : ""}`}
    >
      <div className={styles.rail}>
        <span className={styles.node} data-status={phase.status}>
          <EclipseGlyph phase={index} />
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.phaseHead}>
          <span className={styles.pid}>{phase.id}</span>
          <h2 className={styles.pname}>{phase.name}</h2>
          <span className={styles.statusPill} data-status={phase.status}>
            {phase.label}
          </span>
        </div>
        <p className={styles.pline}>{phase.line}</p>

        <ul className={styles.milestones}>
          {phase.milestones.map((m) => (
            <li
              key={m.text}
              className={styles.milestone}
              data-done={m.done ? "true" : "false"}
            >
              <span className={styles.mNode} aria-hidden />
              <span className={styles.mText}>{m.text}</span>
              <span className={styles.mState}>{m.done ? "Done" : "Planned"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Vertical roadmap timeline. A dim spine runs the height of the track; an ember
 * fill scrubs from top to bottom as the section scrolls, so progress reads
 * against the eclipse phases. One GSAP ScrollTrigger, transform-only (scaleY).
 * Bails to a statically-filled spine under reduced motion or narrow viewports;
 * per-phase reveals come from useInView, which is already reduced-motion aware.
 */
export default function RoadmapTimeline() {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const fill = fillRef.current;
    if (!track || !fill) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || window.innerWidth < 720) {
      fill.style.transform = "scaleY(1)";
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        fill,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: track,
            start: "top 55%",
            end: "bottom 65%",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    }, track);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.timeline}>
      <div className="u-container">
        <div ref={trackRef} className={styles.track}>
          <span className={styles.spine} aria-hidden>
            <span ref={fillRef} className={styles.spineFill} />
          </span>

          {UMBRA.phases.map((p, i) => (
            <PhaseRow key={p.id} phase={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
