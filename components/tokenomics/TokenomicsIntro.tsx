"use client";

import { UMBRA } from "@/app/content";
import { useInView } from "../useInView";
import styles from "./tokenomics.module.css";

/** Non-pinned header: eyebrow + title/line, then a compact quick-facts row
 *  (Supply/Liquidity/Tax/Contract) — deliberately NOT the homepage teaser's
 *  full-viewport giant-figure scale, since the donut below is this page's
 *  centerpiece. Single-shot reveal, same shape as CommunityFooter's finale. */
export default function TokenomicsIntro() {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.15 });
  const figures = UMBRA.tokenomics.figures;

  return (
    <section
      ref={ref}
      className={`${styles.section} ${inView ? styles.inView : ""}`}
    >
      <div className="u-container">
        <p className={`u-eyebrow ${styles.reveal}`}>Tokenomics</p>
        <h1
          className={`${styles.introTitle} ${styles.reveal}`}
          style={{ ["--i" as string]: 1 }}
        >
          Nothing hides from the shadow.
        </h1>
        <p
          className={`${styles.introSub} ${styles.reveal}`}
          style={{ ["--i" as string]: 2 }}
        >
          Supply, allocation, and contract — the full breakdown of{" "}
          {UMBRA.ticker}.
        </p>

        <div className={styles.factGrid}>
          {figures.map((f, i) => (
            <div
              key={f.label}
              className={styles.reveal}
              style={{ ["--i" as string]: 3 + i }}
            >
              <div className={styles.factValue}>{f.value}</div>
              <div className={styles.factLabel}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
