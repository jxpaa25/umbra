"use client";

import { useRef } from "react";
import { UMBRA } from "@/app/content";
import { usePinnedDepthStage } from "./usePinnedDepthStage";
import styles from "./sections.module.css";

/**
 * Roadmap — "Descent to Totality".
 * The four eclipse phases (Umbra → Penumbra → Totality → Corona) are stacked in
 * 3D depth; the section pins and scroll scrubs a descent *through* them — but
 * with a HOLD on each phase (it sits alone, fully readable) then a quick, clean
 * transition to the next, so the words never bleed into each other early. The
 * "Roadmap" header is pinned to the top of the same box for the whole pass, so
 * it stays on screen throughout the effect (see usePinnedDepthStage). Just
 * text — the big centered moon behind it (see hero/Scene MOON_KF) provides the
 * corona for the totality moment; no per-phase discs or rail. CSS 3D + one GSAP
 * pinned/scrubbed timeline (transform / opacity / blur only). Under reduced
 * motion (or narrow viewports) it renders a plain, legible stacked list.
 */
export default function RoadmapTeaser() {
  const stageRef = useRef<HTMLDivElement>(null);
  usePinnedDepthStage(stageRef, "[data-phase]");

  return (
    <section id="roadmap" className={styles.section}>
      <div ref={stageRef} className={styles.stage} data-mode="static">
        <div className={styles.stageHeader}>
          <div className="u-container">
            <div className={styles.marker}>
              <span className={styles.markerLabel}>Roadmap</span>
            </div>
          </div>
        </div>

        <div className={styles.spine}>
          {UMBRA.phases.map((p) => (
            <article
              key={p.id}
              data-phase
              className={`${styles.phase} ${styles.stagePlate}`}
            >
              <span className={styles.pid}>{p.id}</span>
              <h3 className={styles.pname}>{p.name}</h3>
              <p className={styles.pline}>{p.line}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
