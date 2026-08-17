"use client";

import { useRef } from "react";
import Link from "next/link";
import { UMBRA } from "@/app/content";
import { usePinnedDepthStage } from "./usePinnedDepthStage";
import styles from "./sections.module.css";

/**
 * Tokenomics teaser — same pinned depth-stage effect as the Roadmap: the four
 * figures hold in focus one at a time as you scroll, with a quick depth-shift
 * between them. The "Tokenomics" header and the "Full breakdown" CTA are
 * pinned to the top/bottom of the same box for the whole pass, so both stay
 * on screen throughout the effect (see usePinnedDepthStage). Under reduced
 * motion (or narrow viewports) it renders a plain, legible stacked list.
 */
export default function TokenomicsTeaser() {
  const stageRef = useRef<HTMLDivElement>(null);
  const figs = UMBRA.tokenomics.figures;
  usePinnedDepthStage(stageRef, "[data-figure]");

  return (
    <section id="tokenomics" className={styles.section}>
      <div ref={stageRef} className={styles.stage} data-mode="static">
        <div className={styles.stageHeader}>
          <div className="u-container">
            <div className={styles.marker}>
              <span className={styles.markerLabel}>Tokenomics</span>
            </div>
          </div>
        </div>

        <div className={styles.spine}>
          {figs.map((f) => (
            <div
              key={f.label}
              data-figure
              className={`${styles.tokFigure} ${styles.stagePlate}`}
            >
              <div className={styles.tokValue}>{f.value}</div>
              <div className={styles.tokLabel}>{f.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.stageFooter}>
          <div className="u-container">
            <div className={styles.tokEnd}>
              <Link href="/tokenomics" className={styles.markerLink}>
                Full tokenomics breakdown →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
